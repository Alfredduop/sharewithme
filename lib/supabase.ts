import { createClient } from '@supabase/supabase-js';
import { UserData, PropertyListing } from './types';

// Safe environment variable access with fallbacks
const getEnvVar = (key: string, fallback: string = '') => {
  try {
    // Check if import.meta.env is available (Vite)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] || fallback;
    }
    
    // Fallback for other environments
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || fallback;
    }
    
    // Final fallback
    return fallback;
  } catch (error) {
    console.warn(`Error accessing environment variable ${key}:`, error);
    return fallback;
  }
};

// Initialize Supabase client with safe environment variable access
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://your-project.supabase.co');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'your-anon-key');

// Check if we have proper configuration
const isSupabaseConfigured = supabaseUrl && 
                            supabaseAnonKey && 
                            !supabaseUrl.includes('your-project') && 
                            !supabaseAnonKey.includes('your-anon-key') &&
                            supabaseUrl.startsWith('https://') &&
                            supabaseAnonKey.length > 20;

// Initialize Supabase with error handling
let supabase: any;

try {
  if (isSupabaseConfigured) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase connected successfully');
  } else {
    // Create a user-friendly fallback client that doesn't mention setup
    supabase = createFallbackSupabaseClient();
  }
} catch (error) {
  console.error('❌ Error initializing Supabase:', error);
  supabase = createFallbackSupabaseClient();
}

// Fallback Supabase client with user-friendly error messages
function createFallbackSupabaseClient() {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: (callback: any) => {
        // Return the correct Supabase subscription format
        console.log('🔄 Fallback auth state change listener setup');
        
        // Call the callback immediately with no user
        setTimeout(() => callback('INITIAL_SESSION', null), 0);
        
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                console.log('🔄 Fallback auth state change listener unsubscribed');
              }
            }
          }
        };
      },
      signUp: () => Promise.resolve({ 
        data: null, 
        error: { message: 'Service temporarily unavailable. Please try again later or contact support.' } 
      }),
      signInWithPassword: () => Promise.resolve({ 
        data: null, 
        error: { message: 'Service temporarily unavailable. Please try again later or contact support.' } 
      }),
      signOut: () => Promise.resolve({ error: null }),
      setSession: () => Promise.resolve({ data: null, error: null }),
      resend: () => Promise.resolve({ 
        error: { message: 'Service temporarily unavailable. Please try again later.' } 
      }),
      resetPasswordForEmail: () => Promise.resolve({ 
        error: { message: 'Service temporarily unavailable. Please try again later.' } 
      })
    },
    from: (table: string) => ({
      select: () => ({ 
        eq: () => ({ 
          single: () => Promise.resolve({ 
            data: null, 
            error: { message: 'Service temporarily unavailable. Your data will be available once the system is online.' } 
          }),
          order: () => ({ 
            range: () => Promise.resolve({ data: [], error: null }),
            limit: () => Promise.resolve({ data: [], error: null })
          }),
          limit: () => Promise.resolve({ data: [], error: null })
        }),
        order: () => ({ 
          range: () => Promise.resolve({ data: [], error: null }),
          limit: () => Promise.resolve({ data: [], error: null })
        }),
        range: () => Promise.resolve({ data: [], error: null }),
        limit: () => Promise.resolve({ data: [], error: null }),
        gte: () => ({ 
          lte: () => ({ 
            limit: () => Promise.resolve({ data: [], error: null })
          })
        }),
        lte: () => ({ 
          limit: () => Promise.resolve({ data: [], error: null })
        }),
        ilike: () => ({ 
          order: () => ({ 
            limit: () => Promise.resolve({ data: [], error: null })
          }),
          limit: () => Promise.resolve({ data: [], error: null })
        }),
        neq: () => ({ 
          order: () => ({ 
            limit: () => Promise.resolve({ data: [], error: null })
          }),
          limit: () => Promise.resolve({ data: [], error: null })
        })
      }),
      insert: () => ({ 
        select: () => ({ 
          single: () => Promise.resolve({ 
            data: null, 
            error: { message: 'Service temporarily unavailable. Please try again later.' } 
          })
        })
      }),
      update: () => ({ 
        eq: () => ({ 
          select: () => ({ 
            single: () => Promise.resolve({ 
              data: null, 
              error: { message: 'Service temporarily unavailable. Please try again later.' } 
            })
          })
        })
      }),
      delete: () => ({ 
        eq: () => Promise.resolve({ data: null, error: null })
      }),
      upsert: () => ({ 
        select: () => ({ 
          single: () => Promise.resolve({ 
            data: null, 
            error: { message: 'Service temporarily unavailable. Please try again later.' } 
          })
        })
      })
    }),
    storage: {
      from: (bucketName: string) => ({
        upload: (path: string, file: File) => {
          return Promise.resolve({ 
            data: null, 
            error: { 
              message: 'File upload temporarily unavailable. Please try again later.',
              code: 'SERVICE_UNAVAILABLE'
            }
          });
        },
        getPublicUrl: (path: string) => ({ 
          data: { 
            publicUrl: '',
            error: 'File access temporarily unavailable.'
          } 
        }),
        remove: () => Promise.resolve({ 
          error: { 
            message: 'File operations temporarily unavailable.',
            code: 'SERVICE_UNAVAILABLE'
          }
        })
      })
    },
    functions: {
      invoke: () => Promise.resolve({ 
        data: null, 
        error: { message: 'Service temporarily unavailable. Please try again later.' } 
      })
    }
  };
}

// Export a function to check if storage operations are available
export const isStorageAvailable = () => isSupabaseConfigured;

// Export configuration status
export { supabase, isSupabaseConfigured };

// Get current user profile
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

// Create or update user profile
export const createOrGetUserProfile = async (
  userId: string,
  email: string,
  firstName?: string,
  lastName?: string,
  phone?: string,
  age?: number,
  location?: string,
  isVerified?: boolean
) => {
  try {
    // First try to get existing profile
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      return existingProfile;
    }

    // Create new profile if doesn't exist
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        first_name: firstName || 'User',
        last_name: lastName || '',
        phone: phone || null,
        age: age || null,
        location: location || null,
        is_verified: isVerified || false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createOrGetUserProfile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<UserData>) => {
  try {
    const updateData: any = {};
    
    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.age !== undefined) updateData.age = updates.age;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.occupation !== undefined) updateData.occupation = updates.occupation;
    if (updates.interests !== undefined) updateData.interests = updates.interests;
    if (updates.profilePhotoUrl !== undefined) updateData.profile_photo_url = updates.profilePhotoUrl;
    if (updates.personalityScores !== undefined) updateData.personality_scores = updates.personalityScores;
    if (updates.propertyPreferences !== undefined) updateData.property_preferences = updates.propertyPreferences;

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return null;
  }
};

// Upload profile photo to Supabase Storage
export const uploadProfilePhoto = async (file: File, userId: string): Promise<string | null> => {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Please upload an image smaller than 5MB.');
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/profile-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    const photoUrl = publicUrlData.publicUrl;

    // Save photo record to database
    const { error: dbError } = await supabase
      .from('user_photos')
      .insert({
        user_id: userId,
        photo_url: photoUrl,
        file_name: fileName,
        file_size: file.size,
        is_primary: true
      });

    if (dbError) {
      console.error('Error saving photo record:', dbError);
      // Don't throw here, the upload was successful
    }

    // Update user profile with photo URL
    await updateUserProfile(userId, { profilePhotoUrl: photoUrl });

    return photoUrl;
  } catch (error) {
    console.error('Error in uploadProfilePhoto:', error);
    return null;
  }
};

// Delete profile photo
export const deleteProfilePhoto = async (userId: string, photoUrl: string): Promise<boolean> => {
  try {
    // Extract filename from URL
    const fileName = photoUrl.split('/').pop();
    if (!fileName) return false;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('profile-photos')
      .remove([`${userId}/${fileName}`]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('user_photos')
      .delete()
      .eq('user_id', userId)
      .eq('photo_url', photoUrl);

    if (dbError) {
      console.error('Error deleting photo record:', dbError);
    }

    // Update user profile to remove photo URL
    await updateUserProfile(userId, { profilePhotoUrl: null });

    return true;
  } catch (error) {
    console.error('Error in deleteProfilePhoto:', error);
    return false;
  }
};

// Get user's uploaded photos
export const getUserPhotos = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_photos')
      .select('*')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching user photos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserPhotos:', error);
    return [];
  }
};

// Get property listings with pagination
export const getPropertyListings = async (page = 0, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('property_listings')
      .select('*')
      .range(page * limit, (page + 1) * limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching property listings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPropertyListings:', error);
    return [];
  }
};

// Create property listing
export const createPropertyListing = async (listing: Omit<PropertyListing, 'id' | 'created' | 'verified'>) => {
  try {
    const { data, error } = await supabase
      .from('property_listings')
      .insert({
        title: listing.title,
        description: listing.description,
        address: listing.address,
        suburb: listing.suburb,
        state: listing.state,
        postcode: listing.postcode,
        property_type: listing.propertyType,
        rent_per_week: listing.rentPerWeek,
        bond: listing.bond,
        available_from: listing.availableFrom,
        lease_duration: listing.leaseDuration,
        bedrooms_total: listing.bedroomsTotal,
        bedrooms_available: listing.bedroomsAvailable,
        bathrooms: listing.bathrooms,
        parking: listing.parking,
        features: listing.features,
        images: listing.images,
        owner_id: listing.ownerId,
        owner_name: listing.ownerName,
        owner_age: listing.ownerAge,
        verified: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating property listing:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createPropertyListing:', error);
    return null;
  }
};

// Save quiz results
export const saveQuizResults = async (userId: string, quizData: {
  answers: any;
  bio?: string;
  personality_traits?: any;
  match_preferences?: any;
  property_preferences?: any;
}) => {
  try {
    // Update user profile with quiz results
    const updateData: any = {
      quiz_completed: true,
      quiz_completed_at: new Date().toISOString(),
    };

    // Add bio if provided
    if (quizData.bio) {
      updateData.bio = quizData.bio;
    }

    // Add personality scores if provided
    if (quizData.personality_traits) {
      updateData.personality_scores = quizData.personality_traits;
    }

    // Add property preferences if provided
    if (quizData.property_preferences) {
      updateData.property_preferences = quizData.property_preferences;
    }

    // Extract interests from answers if available
    if (quizData.answers.interests && Array.isArray(quizData.answers.interests)) {
      updateData.interests = quizData.answers.interests;
    }

    // Extract occupation from answers if available
    if (quizData.answers.occupation) {
      updateData.occupation = quizData.answers.occupation;
    }

    // Extract age from answers if available
    if (quizData.answers.age) {
      updateData.age = quizData.answers.age;
    }

    // Extract location from answers if available
    if (quizData.answers.preferred_locations) {
      updateData.location = quizData.answers.preferred_locations;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error saving quiz results to user profile:', error);
      throw error;
    }

    // Also save the full quiz answers to a separate table for detailed analysis
    try {
      const { error: quizError } = await supabase
        .from('quiz_results')
        .upsert({
          user_id: userId,
          answers: quizData.answers,
          personality_traits: quizData.personality_traits,
          match_preferences: quizData.match_preferences,
          property_preferences: quizData.property_preferences,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (quizError) {
        console.error('Error saving detailed quiz results:', quizError);
        // Don't throw here as the main profile update was successful
      }
    } catch (detailError) {
      console.error('Error saving detailed quiz results:', detailError);
      // Don't throw here as the main profile update was successful
    }

    return data;
  } catch (error) {
    console.error('Error in saveQuizResults:', error);
    throw error;
  }
};

// Send support request
export const sendSupportRequest = async (name: string, email: string, subject: string, message: string) => {
  try {
    const { data, error } = await supabase
      .from('support_requests')
      .insert({
        name,
        email,
        subject,
        message,
        status: 'open'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating support request:', error);
      return null;
    }

    // Also invoke the edge function to send email
    try {
      const { error: functionError } = await supabase.functions.invoke('send-support-email', {
        body: { name, email, subject, message }
      });

      if (functionError) {
        console.error('Error sending support email:', functionError);
      }
    } catch (functionError) {
      console.error('Error invoking support email function:', functionError);
    }

    return data;
  } catch (error) {
    console.error('Error in sendSupportRequest:', error);
    return null;
  }
};