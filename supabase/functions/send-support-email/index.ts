import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SupportEmailRequest {
  userName: string;
  userEmail: string;
  userId?: string;
  chatHistory: string;
  isUrgent: boolean;
  timestamp: string;
  userAgent: string;
  currentUrl: string;
}

// Email service configuration
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPPORT_EMAIL = 'hello@sharewithme.io';
const FROM_EMAIL = 'support@sharewithme.io';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const requestData: SupportEmailRequest = await req.json();
    const { userName, userEmail, userId, chatHistory, isUrgent, timestamp, userAgent, currentUrl } = requestData;

    // Validate required fields
    if (!userName || !userEmail || !chatHistory) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: userName, userEmail, and chatHistory are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create email subject with priority indicator
    const subject = isUrgent 
      ? `🚨 URGENT - Support Request from ${userName}`
      : `Support Request from ${userName} - Share With Me`;

    // Create detailed email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Support Request - Share With Me</title>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5CF6, #06B6D4, #10B981); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .priority-urgent { border-left: 5px solid #EF4444; background: #FEF2F2; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .priority-normal { border-left: 5px solid #06B6D4; background: #F0F9FF; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .user-info { background: #F9FAFB; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .chat-history { background: #FFFFFF; border: 1px solid #E5E7EB; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .message { margin: 10px 0; padding: 10px; border-radius: 8px; }
          .user-message { background: #EDE9FE; border-left: 3px solid #8B5CF6; }
          .bot-message { background: #F0F9FF; border-left: 3px solid #06B6D4; }
          .footer { background: #F9FAFB; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 14px; color: #6B7280; }
          .action-required { background: #FEF2F2; border: 1px solid #FCA5A5; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Share With Me Support Request</h1>
            <p>Received: ${new Date(timestamp).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</p>
          </div>

          <div class="${isUrgent ? 'priority-urgent' : 'priority-normal'}">
            <h2>${isUrgent ? '🚨 URGENT REQUEST' : '📋 Standard Request'}</h2>
            <p><strong>Priority Level:</strong> ${isUrgent ? 'URGENT - Respond within 1 hour' : 'Normal - Respond within 24 hours'}</p>
          </div>

          <div class="user-info">
            <h3>👤 User Information</h3>
            <p><strong>Name:</strong> ${userName}</p>
            <p><strong>Email:</strong> <a href="mailto:${userEmail}">${userEmail}</a></p>
            <p><strong>User ID:</strong> ${userId || 'Guest User'}</p>
            <p><strong>Current Page:</strong> <a href="${currentUrl}" target="_blank">${currentUrl}</a></p>
            <p><strong>Browser:</strong> ${userAgent}</p>
          </div>

          <div class="action-required">
            <h3>⚡ Action Required</h3>
            <p><strong>Reply directly to:</strong> <a href="mailto:${userEmail}">${userEmail}</a></p>
            <p>The user expects a response ${isUrgent ? 'within 1 hour' : 'within 24 hours'}.</p>
          </div>

          <div class="chat-history">
            <h3>💬 Chat History</h3>
            <div style="white-space: pre-wrap; font-family: monospace; background: #F9FAFB; padding: 15px; border-radius: 4px;">
${chatHistory}
            </div>
          </div>

          <div class="footer">
            <p>This email was sent automatically from the Share With Me support chat system.</p>
            <p>Support Email: hello@sharewithme.io | Platform: Share With Me</p>
            <p>Please respond directly to the user's email address above.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Share With Me Support <${FROM_EMAIL}>`,
        to: [SUPPORT_EMAIL],
        reply_to: userEmail,
        subject: subject,
        html: emailHtml,
        tags: [
          {
            name: 'type',
            value: 'support-request'
          },
          {
            name: 'priority',
            value: isUrgent ? 'urgent' : 'normal'
          },
          {
            name: 'source',
            value: 'chat-widget'
          }
        ]
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Email API failed: ${emailResponse.status} - ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log('Email sent successfully:', emailResult);

    // Initialize Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log the support request to database
    try {
      const { error: dbError } = await supabase
        .from('support_requests')
        .insert({
          user_name: userName,
          user_email: userEmail,
          user_id: userId || null,
          chat_history: chatHistory,
          is_urgent: isUrgent,
          email_sent: true,
          email_id: emailResult.id,
          status: 'sent',
          created_at: timestamp,
          user_agent: userAgent,
          current_url: currentUrl
        });

      if (dbError) {
        console.error('Database logging error:', dbError);
        // Don't fail the request if logging fails
      }
    } catch (dbError) {
      console.error('Database logging failed:', dbError);
      // Continue - email was sent successfully
    }

    // Send auto-reply confirmation to user
    try {
      const autoReplyResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Share With Me Support <${FROM_EMAIL}>`,
          to: [userEmail],
          subject: `Support Request Received - Share With Me`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #8B5CF6, #06B6D4, #10B981); color: white; padding: 20px; border-radius: 8px; text-align: center; }
                .content { padding: 20px; }
                .footer { background: #F9FAFB; padding: 15px; border-radius: 8px; text-align: center; font-size: 14px; color: #6B7280; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ We've received your message!</h1>
                </div>
                <div class="content">
                  <p>Hi ${userName},</p>
                  <p>Thanks for reaching out to Share With Me support! We've received your message and our team will respond ${isUrgent ? 'within 1 hour' : 'within 24 hours'}.</p>
                  <p><strong>Request Details:</strong></p>
                  <ul>
                    <li>Received: ${new Date(timestamp).toLocaleString('en-AU')}</li>
                    <li>Priority: ${isUrgent ? '🚨 Urgent' : 'Normal'}</li>
                    <li>Reference: ${emailResult.id}</li>
                  </ul>
                  <p>In the meantime, you can check our <a href="https://sharewithme.io/help">Help Centre</a> for quick answers to common questions.</p>
                  <p>Cheers,<br>The Share With Me Team</p>
                </div>
                <div class="footer">
                  <p>hello@sharewithme.io | sharewithme.io</p>
                </div>
              </div>
            </body>
            </html>
          `,
          tags: [
            {
              name: 'type',
              value: 'auto-reply'
            }
          ]
        }),
      });

      if (!autoReplyResponse.ok) {
        console.error('Auto-reply failed:', await autoReplyResponse.text());
        // Don't fail the main request
      }
    } catch (autoReplyError) {
      console.error('Auto-reply error:', autoReplyError);
      // Continue - main email was sent successfully
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResult.id,
        message: 'Support request sent instantly to hello@sharewithme.io'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Support email function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send support email',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})