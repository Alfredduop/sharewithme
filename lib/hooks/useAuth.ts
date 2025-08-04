import { useState, useEffect, useCallback } from "react";
import { AuthService, AuthUser } from "../authService";
import { supabaseData } from "../supabaseData";
import { ViewType } from "../types";
import { analytics } from "../analytics";

export const useAuth = (currentView: ViewType) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Track user activity
  const trackUserActivity = useCallback(async (activity: string, metadata: any = {}) => {
    if (user) {
      try {
        await supabaseData.users.trackActivity(user.id, activity, metadata);
        analytics.track(activity, { userId: user.id, ...metadata });
      } catch (error) {
        console.warn('Failed to track user activity:', error);
      }
    }
  }, [user]);

  // Initialize auth and handle auth state changes
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initialiseAuth = async () => {
      try {
        setLoading(true);
        setAuthError(null);

        // Get current user
        const { user: currentUser, error } = await AuthService.getCurrentUser();
        
        if (error) {
          console.error('❌ Auth initialization error:', error);
          setAuthError(error.message);
        } else if (currentUser) {
          console.log('✅ User authenticated:', currentUser.email);
          setUser(currentUser);
          
          // Check if user is new (created within last 5 minutes)
          const userCreatedAt = new Date(currentUser.createdAt);
          const timeDiff = Date.now() - userCreatedAt.getTime();
          setIsNewUser(timeDiff < 300000);

          // Track user session start
          await trackUserActivity('session_start', { 
            view: currentView,
            is_verified: currentUser.isVerified,
            email_confirmed: currentUser.emailConfirmed
          });
        }

      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        setAuthError(error instanceof Error ? error.message : 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state listener
    const setupAuthListener = () => {
      unsubscribe = AuthService.onAuthStateChange(async (authUser) => {
        console.log('🔄 Auth state changed:', authUser?.email);
        
        if (authUser) {
          setUser(authUser);
          setAuthError(null);
          
          // Check if user is new
          const userCreatedAt = new Date(authUser.createdAt);
          const timeDiff = Date.now() - userCreatedAt.getTime();
          setIsNewUser(timeDiff < 300000);

          // Track auth state change
          await trackUserActivity('auth_state_change', { 
            event: 'signed_in',
            is_verified: authUser.isVerified 
          });
        } else {
          setUser(null);
          setIsNewUser(false);
          setAuthError(null);
        }
      });
    };

    initialiseAuth().then(() => {
      setupAuthListener();
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentView, trackUserActivity]);

  const handleLogout = useCallback(async () => {
    try {
      console.log('🔓 Signing out user:', user?.email);
      
      // Track logout activity
      if (user) {
        await trackUserActivity('user_logout', { view: currentView });
      }

      const { error } = await AuthService.signOut();
      
      if (error) {
        console.error('❌ Logout error:', error);
        setAuthError(error.message);
      } else {
        setUser(null);
        setIsNewUser(false);
        setAuthError(null);
        console.log('✅ Logout successful');
      }
    } catch (error) {
      console.error('❌ Logout failed:', error);
      setAuthError(error instanceof Error ? error.message : 'Logout failed');
    }
  }, [user, currentView, trackUserActivity]);

  const handleUserUpdate = useCallback(async (updatedUser: AuthUser) => {
    try {
      console.log('🔄 Updating user:', updatedUser.id);
      
      // Update local state
      setUser(updatedUser);
      
      // Update in database
      try {
        await supabaseData.users.update({
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          age: updatedUser.age,
          location: updatedUser.location,
          isVerified: updatedUser.isVerified,
          profilePhotoUrl: updatedUser.profilePhotoUrl,
          bio: '',
          occupation: '',
          interests: [],
          personalityScores: {},
          propertyPreferences: {}
        });
        
        // Track user update activity
        await trackUserActivity('profile_updated', {
          updated_fields: Object.keys(updatedUser).filter(key => 
            updatedUser[key as keyof AuthUser] !== user?.[key as keyof AuthUser]
          )
        });
        
        console.log('✅ User profile updated successfully');
      } catch (error) {
        console.warn('⚠️ Failed to update user in database:', error);
      }
    } catch (error) {
      console.error('❌ User update failed:', error);
    }
  }, [user, trackUserActivity]);

  return {
    user,
    setUser,
    isNewUser,
    setIsNewUser,
    loading,
    authError,
    handleLogout,
    handleUserUpdate,
    trackUserActivity
  };
};