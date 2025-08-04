import { supabase } from './supabase';

// Pure Supabase data service - replaces Google Sheets integration
export class SupabaseDataService {
  // User management
  static async createOrUpdateUser(userData: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userData.id,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          age: userData.age,
          location: userData.location,
          is_verified: userData.isVerified,
          profile_photo_url: userData.profilePhotoUrl,
          bio: userData.bio,
          occupation: userData.occupation,
          interests: userData.interests,
          personality_scores: userData.personalityScores,
          property_preferences: userData.propertyPreferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  // Property listings
  static async createPropertyListing(listingData: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('property_listings')
        .insert({
          user_id: listingData.userId,
          title: listingData.title,
          location: listingData.location,
          price: listingData.price,
          property_type: listingData.propertyType,
          bedrooms: listingData.bedrooms,
          bathrooms: listingData.bathrooms,
          description: listingData.description,
          amenities: listingData.amenities,
          preferences: listingData.preferences,
          images: listingData.images,
          available_from: listingData.availableFrom,
          lease_length: listingData.leaseLength,
          bond_amount: listingData.bondAmount,
          bills_included: listingData.billsIncluded,
          contact_info: listingData.contactInfo,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating property listing:', error);
      throw error;
    }
  }

  // Quiz results
  static async saveQuizResults(userId: string, results: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .upsert({
          user_id: userId,
          personality_type: results.personalityType,
          lifestyle_preferences: results.lifestylePreferences,
          compatibility_scores: results.compatibilityScores,
          quiz_version: results.quizVersion || '1.0',
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Also update user profile with personality scores
      await this.updateUserPersonalityScores(userId, results);

      return data;
    } catch (error) {
      console.error('Error saving quiz results:', error);
      throw error;
    }
  }

  // Update user personality scores
  static async updateUserPersonalityScores(userId: string, scores: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          personality_scores: scores,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating personality scores:', error);
      throw error;
    }
  }

  // Support requests
  static async createSupportRequest(requestData: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('support_requests')
        .insert({
          user_id: requestData.userId,
          name: requestData.name,
          email: requestData.email,
          message: requestData.message,
          category: requestData.category || 'general',
          priority: requestData.priority || 'medium',
          status: 'open',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating support request:', error);
      throw error;
    }
  }

  // Search and matching
  static async findCompatibleUsers(userId: string, preferences: any = {}): Promise<any[]> {
    try {
      // Basic query - can be enhanced with more sophisticated matching
      let query = supabase
        .from('user_profiles')
        .select('*')
        .neq('id', userId)
        .eq('is_verified', true);

      // Add location filter if specified
      if (preferences.location) {
        query = query.ilike('location', `%${preferences.location}%`);
      }

      // Add age range filter if specified
      if (preferences.minAge || preferences.maxAge) {
        if (preferences.minAge) {
          query = query.gte('age', preferences.minAge);
        }
        if (preferences.maxAge) {
          query = query.lte('age', preferences.maxAge);
        }
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding compatible users:', error);
      return [];
    }
  }

  // Property search
  static async searchProperties(filters: any = {}): Promise<any[]> {
    try {
      let query = supabase
        .from('property_listings')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.bedrooms) {
        query = query.eq('bedrooms', filters.bedrooms);
      }
      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching properties:', error);
      return [];
    }
  }

  // Analytics and insights
  static async trackUserActivity(userId: string, activity: string, metadata: any = {}): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_analytics')
        .insert({
          user_id: userId,
          activity_type: activity,
          metadata: metadata,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking user activity:', error);
      // Don't throw - analytics shouldn't break the app
    }
  }

  // Get user dashboard data
  static async getUserDashboardData(userId: string): Promise<any> {
    try {
      const [userProfile, quizResults, properties, supportRequests] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', userId).single(),
        supabase.from('quiz_results').select('*').eq('user_id', userId).order('completed_at', { ascending: false }).limit(1),
        supabase.from('property_listings').select('*').eq('user_id', userId).eq('is_active', true),
        supabase.from('support_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
      ]);

      return {
        profile: userProfile.data,
        latestQuiz: quizResults.data?.[0],
        properties: properties.data || [],
        recentSupport: supportRequests.data || []
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }
}

// Export a simplified interface for common operations
export const supabaseData = {
  users: {
    create: SupabaseDataService.createOrUpdateUser,
    update: SupabaseDataService.createOrUpdateUser,
    findCompatible: SupabaseDataService.findCompatibleUsers,
    getDashboard: SupabaseDataService.getUserDashboardData,
    trackActivity: SupabaseDataService.trackUserActivity
  },
  
  properties: {
    create: SupabaseDataService.createPropertyListing,
    search: SupabaseDataService.searchProperties
  },
  
  quiz: {
    saveResults: SupabaseDataService.saveQuizResults
  },
  
  support: {
    create: SupabaseDataService.createSupportRequest
  }
};