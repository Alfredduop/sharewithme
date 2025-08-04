import { AnalyticsEvent, AnalyticsSession, DeviceInfo, LocationInfo, UTMData, AnalyticsSummary, RealTimeAnalytics } from './types';

class AnalyticsTracker {
  private sessionId: string;
  private userId?: string;
  private sessionStartTime: string;
  private events: AnalyticsEvent[] = [];
  private isTrackingEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date().toISOString();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking() {
    // Only track in production or when explicitly enabled
    this.isTrackingEnabled = typeof window !== 'undefined' && 
      (window.location.hostname !== 'localhost' || localStorage.getItem('analytics_debug') === 'true');

    if (!this.isTrackingEnabled) return;

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_visibility', 'page_hidden');
      } else {
        this.trackEvent('page_visibility', 'page_visible');
      }
    });

    // Track session end
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Track initial page load
    this.trackPageView(window.location.pathname);
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    
    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bTablet\b)|Android(?=.*\bTablet\b)(?!.*\bMobile\b)/i.test(userAgent);
    
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (isTablet) deviceType = 'tablet';
    else if (isMobile) deviceType = 'mobile';

    // Detect OS
    let os = 'Unknown';
    if (userAgent.indexOf('Win') !== -1) os = 'Windows';
    else if (userAgent.indexOf('Mac') !== -1) os = 'macOS';
    else if (userAgent.indexOf('Linux') !== -1) os = 'Linux';
    else if (userAgent.indexOf('Android') !== -1) os = 'Android';
    else if (userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1) os = 'iOS';

    // Detect browser
    let browser = 'Unknown';
    if (userAgent.indexOf('Chrome') !== -1) browser = 'Chrome';
    else if (userAgent.indexOf('Firefox') !== -1) browser = 'Firefox';
    else if (userAgent.indexOf('Safari') !== -1) browser = 'Safari';
    else if (userAgent.indexOf('Edge') !== -1) browser = 'Edge';
    else if (userAgent.indexOf('Opera') !== -1) browser = 'Opera';

    return {
      type: deviceType,
      os,
      browser,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    };
  }

  private getLocationInfo(): Promise<LocationInfo | undefined> {
    // Use a geolocation API service (in production, you'd use a proper service)
    return fetch('https://ipapi.co/json/')
      .then(response => response.json())
      .then(data => ({
        country: data.country_name,
        region: data.region,
        city: data.city,
        timezone: data.timezone,
        ip: this.hashIP(data.ip) // Hash IP for privacy
      }))
      .catch(() => undefined);
  }

  private hashIP(ip: string): string {
    // Simple hash function for privacy
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      const char = ip.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private getUTMData(): UTMData {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      source: urlParams.get('utm_source') || undefined,
      medium: urlParams.get('utm_medium') || undefined,
      campaign: urlParams.get('utm_campaign') || undefined,
      term: urlParams.get('utm_term') || undefined,
      content: urlParams.get('utm_content') || undefined,
    };
  }

  async trackEvent(
    eventType: AnalyticsEvent['eventType'],
    eventName: string,
    metadata?: Record<string, any>
  ) {
    if (!this.isTrackingEnabled) return;

    const event: AnalyticsEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.sessionId,
      userId: this.userId,
      eventType,
      eventName,
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      device: this.getDeviceInfo(),
      location: await this.getLocationInfo(),
      metadata,
      ...this.getUTMData()
    };

    this.events.push(event);
    
    // Store in localStorage for persistence
    this.saveEventToStorage(event);
    
    console.log('📊 Analytics Event:', event);
  }

  trackPageView(page: string) {
    this.trackEvent('page_view', `Page View: ${page}`, {
      path: page,
      title: document.title,
      url: window.location.href
    });
  }

  trackButtonClick(buttonText: string, location: string) {
    this.trackEvent('button_click', `Button Click: ${buttonText}`, {
      buttonText,
      location,
      element: 'button'
    });
  }

  trackFormSubmit(formName: string, success: boolean = true) {
    this.trackEvent('form_submit', `Form Submit: ${formName}`, {
      formName,
      success,
      element: 'form'
    });
  }

  trackQuizStart() {
    this.trackEvent('quiz_start', 'Personality Quiz Started', {
      feature: 'personality_quiz'
    });
  }

  trackQuizComplete(results: Record<string, any>) {
    this.trackEvent('quiz_complete', 'Personality Quiz Completed', {
      feature: 'personality_quiz',
      results: Object.keys(results).length,
      completed: true
    });
  }

  trackAuthAttempt(method: 'signup' | 'signin') {
    this.trackEvent('auth_attempt', `Auth Attempt: ${method}`, {
      method,
      feature: 'authentication'
    });
  }

  trackAuthSuccess(method: 'signup' | 'signin', userId: string) {
    this.setUserId(userId);
    this.trackEvent('auth_success', `Auth Success: ${method}`, {
      method,
      userId,
      feature: 'authentication'
    });
  }

  trackFeatureInteraction(feature: string, action: string, details?: Record<string, any>) {
    this.trackEvent('feature_interaction', `${feature}: ${action}`, {
      feature,
      action,
      ...details
    });
  }

  private saveEventToStorage(event: AnalyticsEvent) {
    try {
      const existingEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      existingEvents.push(event);
      
      // Keep only last 1000 events to prevent storage overflow
      if (existingEvents.length > 1000) {
        existingEvents.splice(0, existingEvents.length - 1000);
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(existingEvents));
    } catch (error) {
      console.warn('Failed to save analytics event to storage:', error);
    }
  }

  private endSession() {
    const sessionData: AnalyticsSession = {
      id: this.sessionId,
      userId: this.userId,
      startTime: this.sessionStartTime,
      endTime: new Date().toISOString(),
      duration: Date.now() - new Date(this.sessionStartTime).getTime(),
      pageViews: this.events.filter(e => e.eventType === 'page_view').length,
      interactions: this.events.filter(e => e.eventType !== 'page_view').length,
      referrer: document.referrer,
      entryPage: this.events.find(e => e.eventType === 'page_view')?.page || '/',
      exitPage: window.location.pathname,
      device: this.getDeviceInfo(),
      utmData: this.getUTMData()
    };

    try {
      const existingSessions = JSON.parse(localStorage.getItem('analytics_sessions') || '[]');
      existingSessions.push(sessionData);
      localStorage.setItem('analytics_sessions', JSON.stringify(existingSessions));
    } catch (error) {
      console.warn('Failed to save session data:', error);
    }
  }

  // Get analytics data for dashboard
  getAnalyticsData(): { events: AnalyticsEvent[], sessions: AnalyticsSession[] } {
    try {
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      const sessions = JSON.parse(localStorage.getItem('analytics_sessions') || '[]');
      return { events, sessions };
    } catch (error) {
      console.warn('Failed to load analytics data:', error);
      return { events: [], sessions: [] };
    }
  }

  generateSummary(days: number = 7): AnalyticsSummary {
    const { events, sessions } = this.getAnalyticsData();
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const recentEvents = events.filter((e: AnalyticsEvent) => new Date(e.timestamp) > cutoffDate);
    const recentSessions = sessions.filter((s: AnalyticsSession) => new Date(s.startTime) > cutoffDate);

    // Calculate metrics
    const totalVisitors = new Set(recentSessions.map((s: AnalyticsSession) => s.userId || s.id)).size;
    const totalPageViews = recentEvents.filter((e: AnalyticsEvent) => e.eventType === 'page_view').length;
    const totalSessions = recentSessions.length;
    
    const avgSessionDuration = recentSessions.reduce((sum: number, s: AnalyticsSession) => 
      sum + (s.duration || 0), 0) / recentSessions.length / 1000 / 60; // in minutes

    const bounceRate = recentSessions.filter((s: AnalyticsSession) => s.pageViews <= 1).length / totalSessions * 100;

    // Top pages
    const pageViews = recentEvents.filter((e: AnalyticsEvent) => e.eventType === 'page_view');
    const pageCounts = pageViews.reduce((acc: Record<string, number>, e: AnalyticsEvent) => {
      acc[e.page] = (acc[e.page] || 0) + 1;
      return acc;
    }, {});

    const topPages = Object.entries(pageCounts)
      .map(([page, views]) => ({ 
        page, 
        views: views as number,
        uniqueViews: new Set(pageViews.filter((e: AnalyticsEvent) => e.page === page).map((e: AnalyticsEvent) => e.sessionId)).size
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Top referrers
    const referrerCounts = recentSessions.reduce((acc: Record<string, number>, s: AnalyticsSession) => {
      const referrer = s.referrer || 'Direct';
      acc[referrer] = (acc[referrer] || 0) + 1;
      return acc;
    }, {});

    const topReferrers = Object.entries(referrerCounts)
      .map(([referrer, visitors]) => ({ referrer, visitors: visitors as number }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);

    // Device breakdown
    const deviceCounts = recentSessions.reduce((acc: Record<string, number>, s: AnalyticsSession) => {
      const device = s.device?.type || 'Unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    const deviceBreakdown = Object.entries(deviceCounts)
      .map(([device, count]) => ({ 
        device, 
        count: count as number,
        percentage: (count as number) / totalSessions * 100
      }));

    // Hourly traffic (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hourlyEvents = recentEvents.filter((e: AnalyticsEvent) => new Date(e.timestamp) > last24Hours);
    
    const hourlyTraffic = Array.from({ length: 24 }, (_, hour) => {
      const hourEvents = hourlyEvents.filter((e: AnalyticsEvent) => {
        const eventHour = new Date(e.timestamp).getHours();
        return eventHour === hour;
      });
      
      return {
        hour,
        visitors: new Set(hourEvents.map((e: AnalyticsEvent) => e.sessionId)).size,
        pageViews: hourEvents.filter((e: AnalyticsEvent) => e.eventType === 'page_view').length
      };
    });

    // Daily traffic
    const dailyTraffic = Array.from({ length: days }, (_, dayIndex) => {
      const date = new Date(Date.now() - dayIndex * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEvents = recentEvents.filter((e: AnalyticsEvent) => {
        return e.timestamp.startsWith(dateStr);
      });
      
      const daySessions = recentSessions.filter((s: AnalyticsSession) => {
        return s.startTime.startsWith(dateStr);
      });

      return {
        date: dateStr,
        visitors: new Set(dayEvents.map((e: AnalyticsEvent) => e.sessionId)).size,
        pageViews: dayEvents.filter((e: AnalyticsEvent) => e.eventType === 'page_view').length,
        sessions: daySessions.length
      };
    }).reverse();

    // Geographic data
    const locationCounts = recentEvents.reduce((acc: Record<string, number>, e: AnalyticsEvent) => {
      const country = e.location?.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    const geographicData = Object.entries(locationCounts)
      .map(([country, visitors]) => ({ 
        country, 
        visitors: visitors as number,
        percentage: (visitors as number) / recentEvents.length * 100
      }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);

    // Conversion events
    const conversionEvents = [
      { event: 'Quiz Completed', count: recentEvents.filter((e: AnalyticsEvent) => e.eventType === 'quiz_complete').length },
      { event: 'Auth Success', count: recentEvents.filter((e: AnalyticsEvent) => e.eventType === 'auth_success').length },
      { event: 'Property Listed', count: recentEvents.filter((e: AnalyticsEvent) => e.eventName.includes('Property')).length },
      { event: 'Chat Started', count: recentEvents.filter((e: AnalyticsEvent) => e.eventName.includes('Chat')).length }
    ].map(item => ({
      ...item,
      conversionRate: totalVisitors > 0 ? (item.count / totalVisitors * 100) : 0
    }));

    return {
      totalVisitors,
      totalPageViews,
      totalSessions,
      averageSessionDuration: avgSessionDuration,
      bounceRate,
      topPages,
      topReferrers,
      deviceBreakdown,
      hourlyTraffic,
      dailyTraffic,
      geographicData,
      conversionEvents
    };
  }

  getRealTimeData(): RealTimeAnalytics {
    const { events } = this.getAnalyticsData();
    const last5Minutes = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentEvents = events.filter((e: AnalyticsEvent) => new Date(e.timestamp) > last5Minutes);
    const activeVisitors = new Set(recentEvents.map((e: AnalyticsEvent) => e.sessionId)).size;

    const currentPageViews = recentEvents
      .filter((e: AnalyticsEvent) => e.eventType === 'page_view')
      .reduce((acc: Record<string, Set<string>>, e: AnalyticsEvent) => {
        if (!acc[e.page]) acc[e.page] = new Set();
        acc[e.page].add(e.sessionId);
        return acc;
      }, {});

    const topActivePages = Object.entries(currentPageViews)
      .map(([page, sessions]) => ({ page, activeUsers: sessions.size }))
      .sort((a, b) => b.activeUsers - a.activeUsers)
      .slice(0, 5);

    const trafficSources = recentEvents
      .reduce((acc: Record<string, Set<string>>, e: AnalyticsEvent) => {
        const source = e.utm_source || (e.referrer ? new URL(e.referrer).hostname : 'Direct');
        if (!acc[source]) acc[source] = new Set();
        acc[source].add(e.sessionId);
        return acc;
      }, {});

    const topTrafficSources = Object.entries(trafficSources)
      .map(([source, sessions]) => ({ source, activeUsers: sessions.size }))
      .sort((a, b) => b.activeUsers - a.activeUsers)
      .slice(0, 5);

    return {
      activeVisitors,
      currentPageViews: topActivePages,
      recentEvents: recentEvents.slice(-20).reverse(),
      topActivePages,
      trafficSources: topTrafficSources
    };
  }

  // Enable debug mode
  enableDebugMode() {
    localStorage.setItem('analytics_debug', 'true');
    this.isTrackingEnabled = true;
    console.log('🔍 Analytics debug mode enabled');
  }

  // Clear all analytics data
  clearData() {
    localStorage.removeItem('analytics_events');
    localStorage.removeItem('analytics_sessions');
    console.log('🗑️ Analytics data cleared');
  }
}

// Create global analytics instance
export const analytics = new AnalyticsTracker();

// Convenience functions
export const trackPageView = (page: string) => analytics.trackPageView(page);
export const trackButtonClick = (buttonText: string, location: string) => analytics.trackButtonClick(buttonText, location);
export const trackFormSubmit = (formName: string, success?: boolean) => analytics.trackFormSubmit(formName, success);
export const trackQuizStart = () => analytics.trackQuizStart();
export const trackQuizComplete = (results: Record<string, any>) => analytics.trackQuizComplete(results);
export const trackAuthAttempt = (method: 'signup' | 'signin') => analytics.trackAuthAttempt(method);
export const trackAuthSuccess = (method: 'signup' | 'signin', userId: string) => analytics.trackAuthSuccess(method, userId);
export const trackFeatureInteraction = (feature: string, action: string, details?: Record<string, any>) => 
  analytics.trackFeatureInteraction(feature, action, details);