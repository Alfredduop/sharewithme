export type ViewType = 
  | 'landing' 
  | 'quiz' 
  | 'chat' 
  | 'marketplace' 
  | 'listing' 
  | 'blog' 
  | 'blog-post' 
  | 'terms' 
  | 'contact' 
  | 'auth' 
  | 'account-settings';

export type AuthMode = 'signin' | 'signup';

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  age?: number;
  location?: string;
  isVerified: boolean;
  profilePhotoUrl?: string | null;
  bio?: string;
  occupation?: string;
  interests?: string[];
  personalityScores?: Record<string, number>;
  propertyPreferences?: Record<string, any>;
}

export interface PropertyListing {
  id: string;
  title: string;
  description: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  propertyType: 'house' | 'apartment' | 'studio' | 'townhouse' | 'other';
  rentPerWeek: number;
  bond: number;
  availableFrom: string;
  leaseDuration: string;
  bedroomsTotal: number;
  bedroomsAvailable: number;
  bathrooms: number;
  parking: number;
  features: string[];
  images: string[];
  ownerId: string;
  ownerName: string;
  ownerAge: number;
  created: string;
  verified: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  author: string;
  tags: string[];
  featured?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'scale' | 'multi-select' | 'yes-no';
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
  required: boolean;
  category: 'lifestyle' | 'personality' | 'living' | 'social' | 'preferences' | 'background';
}

// Analytics Types
export interface AnalyticsEvent {
  id: string;
  sessionId: string;
  userId?: string;
  eventType: 'page_view' | 'button_click' | 'form_submit' | 'quiz_start' | 'quiz_complete' | 'auth_attempt' | 'auth_success' | 'feature_interaction';
  eventName: string;
  page: string;
  timestamp: string;
  userAgent: string;
  referrer: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  device: DeviceInfo;
  location?: LocationInfo;
  metadata?: Record<string, any>;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  screenResolution: string;
  viewport: string;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  ip?: string; // Hashed for privacy
}

export interface AnalyticsSession {
  id: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  pageViews: number;
  interactions: number;
  referrer: string;
  entryPage: string;
  exitPage?: string;
  device: DeviceInfo;
  location?: LocationInfo;
  utmData?: UTMData;
}

export interface UTMData {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface AnalyticsSummary {
  totalVisitors: number;
  totalPageViews: number;
  totalSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ page: string; views: number; uniqueViews: number }>;
  topReferrers: Array<{ referrer: string; visitors: number }>;
  deviceBreakdown: Array<{ device: string; count: number; percentage: number }>;
  hourlyTraffic: Array<{ hour: number; visitors: number; pageViews: number }>;
  dailyTraffic: Array<{ date: string; visitors: number; pageViews: number; sessions: number }>;
  geographicData: Array<{ country: string; visitors: number; percentage: number }>;
  conversionEvents: Array<{ event: string; count: number; conversionRate: number }>;
}

export interface RealTimeAnalytics {
  activeVisitors: number;
  currentPageViews: Array<{ page: string; viewers: number }>;
  recentEvents: AnalyticsEvent[];
  topActivePages: Array<{ page: string; activeUsers: number }>;
  trafficSources: Array<{ source: string; activeUsers: number }>;
}