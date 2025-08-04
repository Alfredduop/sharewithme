import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-0404c1d1/health", (c) => {
  return c.json({ status: "ok" });
});

// Enhanced email subscription endpoint with better source tracking
app.post("/make-server-0404c1d1/subscribe", async (c) => {
  try {
    const body = await c.req.json();
    const { email, source = "unknown" } = body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return c.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingSubscription = await kv.get(`subscription:${normalizedEmail}`);
    if (existingSubscription) {
      return c.json(
        { 
          success: true, 
          message: "You're already subscribed to our updates!",
          alreadySubscribed: true 
        },
        { status: 200 }
      );
    }

    // Store the subscription with enhanced tracking
    const subscriptionData = {
      email: normalizedEmail,
      subscribedAt: new Date().toISOString(),
      source: source, // 'landing_page', 'blog', 'footer', 'cta_section', etc.
      status: "active",
      ipAddress: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
      id: crypto.randomUUID() // Unique identifier for each subscription
    };

    await kv.set(`subscription:${normalizedEmail}`, subscriptionData);

    // Update aggregated data for analytics
    const allSubscriptions = await kv.get("all_subscriptions") || [];
    allSubscriptions.push(normalizedEmail);
    await kv.set("all_subscriptions", allSubscriptions);

    // Track subscription sources for analytics
    const sourceStats = await kv.get("subscription_sources") || {};
    sourceStats[source] = (sourceStats[source] || 0) + 1;
    await kv.set("subscription_sources", sourceStats);

    // Track daily subscription count
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const dailyKey = `daily_subscriptions:${today}`;
    const todayCount = await kv.get(dailyKey) || 0;
    await kv.set(dailyKey, todayCount + 1);

    console.log(`✅ New email subscription from ${source}: ${normalizedEmail}`);

    // Determine response message based on source
    let message = "Thanks for subscribing! We'll keep you updated.";
    if (source === "blog") {
      message = "Thanks for subscribing! You'll get our latest blog posts and sharehouse tips.";
    } else if (source === "landing_page") {
      message = "Thanks for subscribing! We'll keep you updated on our launch.";
    } else if (source === "footer") {
      message = "Thanks for subscribing! Stay connected with our latest updates.";
    }

    return c.json({
      success: true,
      message: message
    });

  } catch (error) {
    console.error("❌ Email subscription error:", error);
    return c.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
});

// Enhanced subscription stats with analytics
app.get("/make-server-0404c1d1/subscription-stats", async (c) => {
  try {
    const allSubscriptions = await kv.get("all_subscriptions") || [];
    const sourceStats = await kv.get("subscription_sources") || {};
    
    // Get recent daily stats (last 30 days)
    const dailyStats = {};
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dailyKey = `daily_subscriptions:${dateKey}`;
      const count = await kv.get(dailyKey) || 0;
      if (count > 0) {
        dailyStats[dateKey] = count;
      }
    }
    
    return c.json({
      totalSubscribers: allSubscriptions.length,
      subscribers: allSubscriptions,
      sourceBreakdown: sourceStats,
      dailyStats: dailyStats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Failed to get subscription stats:", error);
    return c.json(
      { error: "Failed to retrieve subscription stats" },
      { status: 500 }
    );
  }
});

// Get detailed subscription information (admin only)
app.get("/make-server-0404c1d1/subscription-details", async (c) => {
  try {
    const allSubscriptions = await kv.get("all_subscriptions") || [];
    const detailedSubscriptions = [];

    // Get detailed info for each subscription
    for (const email of allSubscriptions) {
      const subscriptionData = await kv.get(`subscription:${email}`);
      if (subscriptionData) {
        detailedSubscriptions.push(subscriptionData);
      }
    }

    // Sort by subscription date (newest first)
    detailedSubscriptions.sort((a, b) => 
      new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime()
    );

    return c.json({
      totalSubscribers: detailedSubscriptions.length,
      subscriptions: detailedSubscriptions,
      exportedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Failed to get detailed subscription info:", error);
    return c.json(
      { error: "Failed to retrieve detailed subscription information" },
      { status: 500 }
    );
  }
});

// Unsubscribe endpoint with better tracking
app.post("/make-server-0404c1d1/unsubscribe", async (c) => {
  try {
    const body = await c.req.json();
    const { email, reason = "user_request" } = body;

    if (!email) {
      return c.json(
        { error: "Please provide an email address" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get existing subscription data before removing
    const existingSubscription = await kv.get(`subscription:${normalizedEmail}`);
    
    // Store unsubscribe record for analytics
    if (existingSubscription) {
      const unsubscribeData = {
        email: normalizedEmail,
        unsubscribedAt: new Date().toISOString(),
        originalSubscribeDate: existingSubscription.subscribedAt,
        source: existingSubscription.source,
        reason: reason,
        daysSubscribed: Math.floor((new Date().getTime() - new Date(existingSubscription.subscribedAt).getTime()) / (1000 * 60 * 60 * 24))
      };
      
      await kv.set(`unsubscribe:${normalizedEmail}`, unsubscribeData);
      
      // Track unsubscribe reasons
      const unsubscribeReasons = await kv.get("unsubscribe_reasons") || {};
      unsubscribeReasons[reason] = (unsubscribeReasons[reason] || 0) + 1;
      await kv.set("unsubscribe_reasons", unsubscribeReasons);
    }

    // Remove from individual subscription
    await kv.del(`subscription:${normalizedEmail}`);

    // Remove from all subscriptions list
    const allSubscriptions = await kv.get("all_subscriptions") || [];
    const updatedSubscriptions = allSubscriptions.filter(sub => sub !== normalizedEmail);
    await kv.set("all_subscriptions", updatedSubscriptions);

    console.log(`✅ Email unsubscribed: ${normalizedEmail} (reason: ${reason})`);

    return c.json({
      success: true,
      message: "You've been successfully unsubscribed. We're sorry to see you go!"
    });

  } catch (error) {
    console.error("❌ Email unsubscribe error:", error);
    return c.json(
      { error: "Failed to unsubscribe. Please try again." },
      { status: 500 }
    );
  }
});

// Bulk export endpoint for email marketing tools
app.get("/make-server-0404c1d1/export-subscribers", async (c) => {
  try {
    const format = c.req.query("format") || "json"; // json, csv
    const source = c.req.query("source"); // optional filter by source
    
    const allSubscriptions = await kv.get("all_subscriptions") || [];
    const exportData = [];

    // Get detailed info for each subscription
    for (const email of allSubscriptions) {
      const subscriptionData = await kv.get(`subscription:${email}`);
      if (subscriptionData) {
        // Apply source filter if specified
        if (!source || subscriptionData.source === source) {
          exportData.push({
            email: subscriptionData.email,
            subscribedAt: subscriptionData.subscribedAt,
            source: subscriptionData.source,
            status: subscriptionData.status
          });
        }
      }
    }

    if (format === "csv") {
      // Convert to CSV format
      const csvHeader = "Email,Subscribed At,Source,Status\n";
      const csvRows = exportData.map(sub => 
        `${sub.email},${sub.subscribedAt},${sub.source},${sub.status}`
      ).join("\n");
      
      return new Response(csvHeader + csvRows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return c.json({
      totalSubscribers: exportData.length,
      exportedAt: new Date().toISOString(),
      source: source || "all",
      subscribers: exportData
    });

  } catch (error) {
    console.error("❌ Failed to export subscribers:", error);
    return c.json(
      { error: "Failed to export subscribers" },
      { status: 500 }
    );
  }
});

Deno.serve(app.fetch);