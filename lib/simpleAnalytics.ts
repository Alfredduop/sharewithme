// Simple analytics system that won't break the page
interface SimpleEvent {
  event: string;
  properties?: Record<string, any>;
}

class SimpleAnalytics {
  private events: SimpleEvent[] = [];
  private isEnabled = true;

  constructor() {
    // Only enable in development for now
    this.isEnabled = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1'));
  }

  track(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    try {
      const eventData: SimpleEvent = {
        event,
        properties: {
          ...properties,
          timestamp: Date.now()
        }
      };

      this.events.push(eventData);
      console.log('📊 Analytics:', eventData);

      // Store in localStorage for simple persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('simple-analytics', JSON.stringify(this.events.slice(-100))); // Keep last 100 events
      }
    } catch (error) {
      // Silently fail
    }
  }

  getEvents(): SimpleEvent[] {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('simple-analytics');
        return stored ? JSON.parse(stored) : [];
      }
    } catch (error) {
      // Silently fail
    }
    return [];
  }

  clearEvents() {
    this.events = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('simple-analytics');
    }
  }
}

// Create global instance
export const simpleAnalytics = new SimpleAnalytics();

// Helper functions
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  simpleAnalytics.track(event, properties);
};

export const trackPageView = (page: string) => {
  trackEvent('page_view', { page });
};

export const trackButtonClick = (button: string, location?: string) => {
  trackEvent('button_click', { button, location });
};

export const trackFeatureUsage = (feature: string, action: string, properties?: Record<string, any>) => {
  trackEvent('feature_usage', { feature, action, ...properties });
};