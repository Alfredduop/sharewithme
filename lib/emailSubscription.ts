import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface SubscriptionResponse {
  success: boolean;
  message: string;
  alreadySubscribed?: boolean;
  error?: string;
}

export type SubscriptionSource = 
  | 'landing_page' 
  | 'blog' 
  | 'footer' 
  | 'cta_section' 
  | 'newsletter_section'
  | 'unknown';

export class EmailSubscriptionService {
  private static baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-0404c1d1`;

  // Subscribe to email updates with source tracking
  static async subscribe(email: string, source: SubscriptionSource = 'unknown'): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ 
          email: email.trim(),
          source: source
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message,
          alreadySubscribed: data.alreadySubscribed || false,
        };
      } else {
        return {
          success: false,
          message: data.error || 'Failed to subscribe. Please try again.',
          error: data.error,
        };
      }

    } catch (error) {
      console.error('Email subscription error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Unsubscribe from email updates with reason tracking
  static async unsubscribe(email: string, reason: string = 'user_request'): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ 
          email: email.trim(),
          reason: reason
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message,
        };
      } else {
        return {
          success: false,
          message: data.error || 'Failed to unsubscribe. Please try again.',
          error: data.error,
        };
      }

    } catch (error) {
      console.error('Email unsubscribe error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get subscription statistics with enhanced analytics
  static async getStats(): Promise<{
    totalSubscribers: number; 
    subscribers: string[];
    sourceBreakdown: Record<string, number>;
    dailyStats: Record<string, number>;
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/subscription-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          totalSubscribers: data.totalSubscribers || 0,
          subscribers: data.subscribers || [],
          sourceBreakdown: data.sourceBreakdown || {},
          dailyStats: data.dailyStats || {},
        };
      } else {
        console.error('Failed to get subscription stats:', response.status);
        return null;
      }

    } catch (error) {
      console.error('Failed to get subscription stats:', error);
      return null;
    }
  }

  // Get detailed subscription information (admin only)
  static async getDetailedStats(): Promise<{
    totalSubscribers: number;
    subscriptions: any[];
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/subscription-details`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          totalSubscribers: data.totalSubscribers || 0,
          subscriptions: data.subscriptions || [],
        };
      } else {
        console.error('Failed to get detailed subscription stats:', response.status);
        return null;
      }

    } catch (error) {
      console.error('Failed to get detailed subscription stats:', error);
      return null;
    }
  }

  // Export subscribers in various formats
  static async exportSubscribers(format: 'json' | 'csv' = 'json', source?: string): Promise<Blob | null> {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (source) {
        params.append('source', source);
      }

      const response = await fetch(`${this.baseUrl}/export-subscribers?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        return await response.blob();
      } else {
        console.error('Failed to export subscribers:', response.status);
        return null;
      }

    } catch (error) {
      console.error('Failed to export subscribers:', error);
      return null;
    }
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  // Normalize email (lowercase and trim)
  static normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }
}

export default EmailSubscriptionService;