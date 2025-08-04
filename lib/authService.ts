import { supabase } from './supabase';
import { supabaseData } from './supabaseData';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  age?: number;
  location?: string;
  isVerified: boolean;
  profilePhotoUrl?: string | null;
  emailConfirmed: boolean;
  createdAt: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export class AuthService {
  // Test Supabase connection
  static async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        return { connected: false, error: error.message };
      }
      return { connected: true };
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown connection error' 
      };
    }
  }

  // Enhanced sign up with comprehensive error handling and debugging
  static async signUp(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    age: number;
    location: string;
    idDocumentUrl?: string;
  }): Promise<{ user?: AuthUser; error?: AuthError; needsEmailConfirmation?: boolean }> {
    try {
      console.log('🔐 Starting signup process');
      console.log('📋 User data (sanitized):', {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone.slice(0, 3) + '***',
        age: userData.age,
        location: userData.location,
        hasIdDocument: !!userData.idDocumentUrl
      });

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        console.log('❌ Email validation failed');
        return { error: { code: 'invalid_email', message: 'Please enter a valid email address.' } };
      }

      // Validate password strength
      if (userData.password.length < 8) {
        console.log('❌ Password validation failed');
        return { error: { code: 'weak_password', message: 'Password must be at least 8 characters long.' } };
      }

      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'phone', 'location'];
      for (const field of requiredFields) {
        if (!userData[field as keyof typeof userData]) {
          console.log(`❌ Required field missing: ${field}`);
          return { 
            error: { 
              code: 'missing_field', 
              message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required.` 
            } 
          };
        }
      }

      // Validate age
      if (userData.age < 16 || userData.age > 100) {
        console.log('❌ Age validation failed');
        return { error: { code: 'invalid_age', message: 'Age must be between 16 and 100.' } };
      }

      // Validate phone (basic Australian format)
      const phoneRegex = /^(\+61|0)[2-9]\d{8}$/;
      if (!phoneRegex.test(userData.phone.replace(/\s+/g, ''))) {
        console.log('❌ Phone validation failed');
        return { 
          error: { 
            code: 'invalid_phone', 
            message: 'Please enter a valid Australian phone number.' 
          } 
        };
      }

      console.log('✅ All client-side validation passed');

      // Test Supabase connection before attempting signup
      const connectionTest = await this.testConnection();
      if (!connectionTest.connected) {
        console.error('❌ Supabase connection failed:', connectionTest.error);
        return {
          error: {
            code: 'connection_failed',
            message: 'Unable to connect to our servers. Please check your internet connection and try again.',
            details: connectionTest.error
          }
        };
      }

      console.log('✅ Supabase connection verified');

      // Attempt Supabase signup with detailed logging
      console.log('🔄 Attempting Supabase auth signup...');
      const signupPayload = {
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone,
            age: userData.age,
            location: userData.location,
            is_verified: !!userData.idDocumentUrl,
            id_document_url: userData.idDocumentUrl,
          },
        },
      };

      console.log('📤 Signup payload (sanitized):', {
        email: signupPayload.email,
        options: {
          data: {
            ...signupPayload.options.data,
            phone: signupPayload.options.data.phone.slice(0, 3) + '***'
          }
        }
      });

      const { data, error } = await supabase.auth.signUp(signupPayload);

      if (error) {
        console.error('❌ Supabase signup error:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          code: error.code || 'NO_CODE',
          name: error.name || 'NO_NAME',
          cause: error.cause || 'NO_CAUSE'
        });
        
        // Enhanced error handling with specific cases
        if (error.message.includes('User already registered') || 
            error.message.includes('duplicate') ||
            error.code === 'user_already_exists') {
          return { 
            error: { 
              code: 'user_exists', 
              message: 'An account with this email already exists. Try signing in instead.',
              details: error
            } 
          };
        } else if (error.message.includes('Password should be at least') ||
                   error.code === 'weak_password') {
          return { 
            error: { 
              code: 'weak_password', 
              message: 'Password must be at least 6 characters long.',
              details: error
            } 
          };
        } else if (error.message.includes('Invalid email') || 
                   error.message.includes('email') ||
                   error.code === 'invalid_email') {
          return { 
            error: { 
              code: 'invalid_email', 
              message: 'Please enter a valid email address.',
              details: error
            } 
          };
        } else if (error.message.includes('Signups not allowed') ||
                   error.code === 'signup_disabled') {
          return {
            error: {
              code: 'signup_disabled',
              message: 'Account registration is temporarily disabled. Please contact support.',
              details: error
            }
          };
        } else if (error.status === 429) {
          return {
            error: {
              code: 'rate_limit',
              message: 'Too many signup attempts. Please wait a moment and try again.',
              details: error
            }
          };
        } else if (error.status >= 500) {
          return {
            error: {
              code: 'server_error',
              message: 'Our servers are experiencing issues. Please try again in a few minutes.',
              details: error
            }
          };
        } else if (error.message.includes('network') || 
                   error.message.includes('fetch') ||
                   error.name === 'TypeError') {
          return { 
            error: { 
              code: 'network_error', 
              message: 'Network error. Please check your internet connection and try again.',
              details: error
            } 
          };
        } else if (error.message.includes('timeout')) {
          return { 
            error: { 
              code: 'timeout_error', 
              message: 'The request timed out. Please try again.',
              details: error
            } 
          };
        }
        
        // Return the actual error message for better debugging
        return { 
          error: { 
            code: error.code || error.name || 'signup_failed', 
            message: error.message || 'Account creation failed. Please try again.',
            details: error
          } 
        };
      }

      if (!data.user) {
        console.error('❌ No user returned from Supabase signup');
        return { 
          error: { 
            code: 'no_user', 
            message: 'Account creation failed - no user data returned. Please try again.',
            details: 'Supabase returned null user'
          } 
        };
      }

      console.log('✅ Supabase signup successful, user ID:', data.user.id);

      // Save additional user data to our database with enhanced error handling
      try {
        console.log('💾 Attempting to save user profile to database');
        
        const profileData = {
          id: data.user.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          age: userData.age,
          location: userData.location,
          isVerified: !!userData.idDocumentUrl,
          profilePhotoUrl: null,
          bio: '',
          occupation: '',
          interests: [],
          personalityScores: {},
          propertyPreferences: {},
        };

        await supabaseData.users.create(profileData);
        console.log('✅ User profile saved to database successfully');
        
      } catch (dbError: any) {
        console.error('❌ Failed to save user profile to database:', dbError);
        console.error('Database error details:', {
          message: dbError.message,
          code: dbError.code,
          details: dbError.details,
          hint: dbError.hint,
          table: dbError.table
        });
        
        // Continue with signup even if profile save fails, but log it
        console.warn('⚠️ Continuing with signup despite database save failure - user can complete profile later');
      }

      // Check if email confirmation is needed
      if (!data.user.email_confirmed_at) {
        console.log('📧 Email confirmation required for:', userData.email);
        return { needsEmailConfirmation: true };
      }

      // Return successful user data
      const authUser: AuthUser = {
        id: data.user.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        age: userData.age,
        location: userData.location,
        isVerified: !!userData.idDocumentUrl,
        profilePhotoUrl: null,
        emailConfirmed: !!data.user.email_confirmed_at,
        createdAt: data.user.created_at || new Date().toISOString(),
      };

      console.log('✅ Signup completed successfully for:', userData.email);
      return { user: authUser };

    } catch (error: any) {
      console.error('❌ Signup exception caught:', error);
      console.error('Exception details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause
      });
      
      // Enhanced exception handling
      let errorMessage = 'An unexpected error occurred during account creation.';
      let errorCode = 'unexpected_error';
      
      if (error instanceof Error) {
        if (error.message.includes('network') || 
            error.message.includes('fetch') || 
            error.name === 'TypeError' ||
            error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
          errorCode = 'network_error';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'The request timed out. Please try again.';
          errorCode = 'timeout_error';
        } else if (error.message.includes('duplicate')) {
          errorMessage = 'An account with this email already exists. Please try signing in instead.';
          errorCode = 'user_exists';
        } else {
          errorMessage = `Account creation failed: ${error.message}`;
          errorCode = 'creation_failed';
        }
      }
      
      return { 
        error: { 
          code: errorCode, 
          message: errorMessage,
          details: error
        } 
      };
    }
  }

  // Sign in with enhanced error handling
  static async signIn(email: string, password: string): Promise<{ user?: AuthUser; error?: AuthError }> {
    try {
      console.log('🔐 Starting signin for:', email);

      // Basic validation
      if (!email || !password) {
        return { 
          error: { 
            code: 'missing_credentials', 
            message: 'Please enter both email and password.' 
          } 
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('❌ Signin error:', error);
        
        if (error.message.includes('Invalid login credentials')) {
          return { 
            error: { 
              code: 'invalid_credentials', 
              message: 'Invalid email or password. Please check your credentials and try again.' 
            } 
          };
        } else if (error.message.includes('Email not confirmed')) {
          return { 
            error: { 
              code: 'email_not_confirmed', 
              message: 'Please check your email and click the confirmation link to activate your account.' 
            } 
          };
        } else if (error.message.includes('Too many requests')) {
          return { 
            error: { 
              code: 'too_many_requests', 
              message: 'Too many signin attempts. Please wait a moment and try again.' 
            } 
          };
        }
        
        return { 
          error: { 
            code: error.name || 'signin_failed', 
            message: error.message || 'Sign in failed. Please try again.' 
          } 
        };
      }

      if (!data.user) {
        return { 
          error: { 
            code: 'no_user', 
            message: 'Sign in failed. Please try again.' 
          } 
        };
      }

      // Get user profile from our database with enhanced error handling
      let userProfile;
      try {
        const dashboardData = await supabaseData.users.getDashboard(data.user.id);
        userProfile = dashboardData.profile;
        console.log('✅ User profile loaded from database');
      } catch (profileError) {
        console.warn('⚠️ Failed to load user profile from database, using auth metadata:', profileError);
        // Use metadata from auth as fallback
        userProfile = {
          first_name: data.user.user_metadata?.first_name || 'User',
          last_name: data.user.user_metadata?.last_name || '',
          phone: data.user.user_metadata?.phone,
          age: data.user.user_metadata?.age,
          location: data.user.user_metadata?.location,
          is_verified: data.user.user_metadata?.is_verified || false,
          profile_photo_url: data.user.user_metadata?.profile_photo_url,
        };
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || email,
        firstName: userProfile?.first_name || 'User',
        lastName: userProfile?.last_name || '',
        phone: userProfile?.phone,
        age: userProfile?.age,
        location: userProfile?.location,
        isVerified: userProfile?.is_verified || false,
        profilePhotoUrl: userProfile?.profile_photo_url,
        emailConfirmed: !!data.user.email_confirmed_at,
        createdAt: data.user.created_at || new Date().toISOString(),
      };

      console.log('✅ Signin successful for:', email);
      return { user: authUser };

    } catch (error) {
      console.error('❌ Signin exception:', error);
      return { 
        error: { 
          code: 'unexpected_error', 
          message: 'An unexpected error occurred. Please try again.' 
        } 
      };
    }
  }

  // Get current session
  static async getCurrentUser(): Promise<{ user?: AuthUser; error?: AuthError }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Session error:', error);
        return { 
          error: { 
            code: 'session_error', 
            message: 'Failed to get current session.' 
          } 
        };
      }

      if (!session?.user) {
        return {}; // No user signed in
      }

      // Get user profile
      let userProfile;
      try {
        const dashboardData = await supabaseData.users.getDashboard(session.user.id);
        userProfile = dashboardData.profile;
      } catch (profileError) {
        console.warn('⚠️ Failed to load user profile:', profileError);
        userProfile = {
          first_name: session.user.user_metadata?.first_name || 'User',
          last_name: session.user.user_metadata?.last_name || '',
          phone: session.user.user_metadata?.phone,
          age: session.user.user_metadata?.age,
          location: session.user.user_metadata?.location,
          is_verified: session.user.user_metadata?.is_verified || false,
          profile_photo_url: session.user.user_metadata?.profile_photo_url,
        };
      }

      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email || '',
        firstName: userProfile?.first_name || 'User',
        lastName: userProfile?.last_name || '',
        phone: userProfile?.phone,
        age: userProfile?.age,
        location: userProfile?.location,
        isVerified: userProfile?.is_verified || false,
        profilePhotoUrl: userProfile?.profile_photo_url,
        emailConfirmed: !!session.user.email_confirmed_at,
        createdAt: session.user.created_at || new Date().toISOString(),
      };

      return { user: authUser };

    } catch (error) {
      console.error('❌ Get current user exception:', error);
      return { 
        error: { 
          code: 'unexpected_error', 
          message: 'Failed to get current user.' 
        } 
      };
    }
  }

  // Sign out
  static async signOut(): Promise<{ error?: AuthError }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Signout error:', error);
        return { 
          error: { 
            code: 'signout_failed', 
            message: 'Failed to sign out. Please try again.' 
          } 
        };
      }

      console.log('✅ Signout successful');
      return {};

    } catch (error) {
      console.error('❌ Signout exception:', error);
      return { 
        error: { 
          code: 'unexpected_error', 
          message: 'An unexpected error occurred during sign out.' 
        } 
      };
    }
  }

  // Resend confirmation email
  static async resendConfirmation(email: string): Promise<{ error?: AuthError }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        console.error('❌ Resend confirmation error:', error);
        return { 
          error: { 
            code: 'resend_failed', 
            message: error.message || 'Failed to resend confirmation email.' 
          } 
        };
      }

      console.log('✅ Confirmation email resent to:', email);
      return {};

    } catch (error) {
      console.error('❌ Resend confirmation exception:', error);
      return { 
        error: { 
          code: 'unexpected_error', 
          message: 'Failed to resend confirmation email.' 
        } 
      };
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<{ error?: AuthError }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        console.error('❌ Password reset error:', error);
        return { 
          error: { 
            code: 'reset_failed', 
            message: error.message || 'Failed to send password reset email.' 
          } 
        };
      }

      console.log('✅ Password reset email sent to:', email);
      return {};

    } catch (error) {
      console.error('❌ Password reset exception:', error);
      return { 
        error: { 
          code: 'unexpected_error', 
          message: 'Failed to send password reset email.' 
        } 
      };
    }
  }

  // Listen for auth state changes - Fixed to properly return unsubscribe function
  static onAuthStateChange(callback: (user: AuthUser | null) => void): (() => void) {
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);

        if (session?.user) {
          try {
            const { user } = await this.getCurrentUser();
            callback(user || null);
          } catch (error) {
            console.error('❌ Failed to get user on auth state change:', error);
            callback(null);
          }
        } else {
          callback(null);
        }
      });

      // Return the unsubscribe function
      return () => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      };
    } catch (error) {
      console.error('❌ Error setting up auth state change listener:', error);
      // Return a no-op function if there's an error
      return () => {};
    }
  }
}