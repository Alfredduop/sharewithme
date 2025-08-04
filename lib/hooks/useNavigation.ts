import { useState } from "react";
import { ViewType, AuthMode, UserData } from "../types";

interface NavigationHookProps {
  setCurrentView: (view: ViewType) => void;
  setAuthMode: (mode: AuthMode) => void;
  setSelectedBlogPost: (postId: string | null) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setUser: (user: UserData) => void;
  setIsNewUser: (isNew: boolean) => void;
  user: UserData | null;
}

export const useNavigation = ({
  setCurrentView,
  setAuthMode,
  setSelectedBlogPost,
  setMobileMenuOpen,
  setUser,
  setIsNewUser,
  user
}: NavigationHookProps) => {

  // Safe navigation function wrapper
  const safeNavigate = (navigateFunction: () => void, functionName: string) => {
    try {
      console.log(`🎯 Executing ${functionName}`);
      navigateFunction();
      console.log(`✅ ${functionName} completed successfully`);
    } catch (error) {
      console.error(`❌ Error in ${functionName}:`, error);
      alert(`Unable to navigate. Please refresh the page and try again.`);
    }
  };

  // Navigation handlers
  const startQuiz = () => safeNavigate(() => {
    setCurrentView('quiz');
    setMobileMenuOpen(false);
  }, 'startQuiz');

  const startListing = () => safeNavigate(() => {
    setCurrentView('listing');
    setMobileMenuOpen(false);
  }, 'startListing');

  const openChat = () => safeNavigate(() => {
    if (user) {
      setIsNewUser(false);
      setCurrentView('chat');
    } else {
      setAuthMode('signup');
      setCurrentView('auth');
    }
    setMobileMenuOpen(false);
  }, 'openChat');

  const openMarketplace = () => safeNavigate(() => {
    if (user) {
      setIsNewUser(false);
      setCurrentView('marketplace');
    } else {
      setAuthMode('signup');
      setCurrentView('auth');
    }
    setMobileMenuOpen(false);
  }, 'openMarketplace');

  const openTerms = () => safeNavigate(() => {
    setCurrentView('terms');
    setMobileMenuOpen(false);
  }, 'openTerms');

  const openBlog = () => safeNavigate(() => {
    setCurrentView('blog');
    setMobileMenuOpen(false);
  }, 'openBlog');

  const openContact = () => safeNavigate(() => {
    setCurrentView('contact');
    setMobileMenuOpen(false);
  }, 'openContact');

  const handleSelectBlogPost = (postId: string) => safeNavigate(() => {
    setSelectedBlogPost(postId);
    setCurrentView('blog-post');
  }, 'selectBlogPost');

  const openSignIn = () => safeNavigate(() => {
    setAuthMode('signin');
    setCurrentView('auth');
    setMobileMenuOpen(false);
  }, 'openSignIn');

  const openAccountSettings = () => safeNavigate(() => {
    setCurrentView('account-settings');
    setMobileMenuOpen(false);
  }, 'openAccountSettings');

  const backToLanding = () => safeNavigate(() => {
    setCurrentView('landing');
  }, 'backToLanding');

  const handleGetStarted = () => {
    try {
      console.log('🚀 Get Started button clicked');
      console.log('📊 Current state before navigation:', { 
        user: user?.firstName || 'anonymous'
      });
      
      setAuthMode('signup');
      setCurrentView('auth');
      setMobileMenuOpen(false);
      
      console.log('✅ Navigation to auth signup completed');
      
    } catch (error) {
      console.error('❌ Error in Get Started handler:', error);
      
      if (confirm('Unable to open signup form. Would you like to refresh the page?')) {
        window.location.reload();
      }
    }
  };

  const handleQuizComplete = () => safeNavigate(() => {
    console.log('🎯 Quiz completed, user state:', user ? 'logged in' : 'anonymous');
    
    if (user) {
      console.log('✅ User logged in, proceeding to chat');
      setIsNewUser(false);
      setCurrentView('chat');
    } else {
      console.log('🔐 User not logged in, quiz component will handle account creation');
    }
  }, 'handleQuizComplete');

  const handleAuthComplete = async (userData: UserData, isSigningUp: boolean = false) => {
    try {
      console.log('🎯 Auth complete:', { userData, isSigningUp });
      setUser(userData);
      setIsNewUser(isSigningUp);
      
      // Check if user completed quiz before signing up
      const savedQuizResults = localStorage.getItem('sharewithme_quiz_results');
      if (savedQuizResults && isSigningUp) {
        try {
          const quizData = JSON.parse(savedQuizResults);
          console.log('🎯 Found saved quiz results for new user');
          
          // For now, just save to localStorage to be processed later
          // In a full implementation, you'd save to Supabase here
          console.log('📝 Quiz data will be processed when Supabase is fully configured');
          
          localStorage.removeItem('sharewithme_quiz_results');
          console.log('✅ Quiz results processed for new user account');
        } catch (error) {
          console.warn('⚠️ Could not parse saved quiz results:', error);
        }
      }
      
      setCurrentView('chat');
    } catch (error) {
      console.error('Error in handleAuthComplete:', error);
    }
  };

  const handleMarketplaceAuthRequired = () => safeNavigate(() => {
    setAuthMode('signup');
    setCurrentView('auth');
  }, 'handleMarketplaceAuthRequired');

  const handleMarketplaceOpenChat = (userId: string) => safeNavigate(() => {
    setCurrentView('chat');
  }, 'handleMarketplaceOpenChat');

  const handleQuizAuthRequired = () => safeNavigate(() => {
    console.log('🔐 Quiz requesting user authentication');
    setAuthMode('signup');
    setCurrentView('auth');
  }, 'handleQuizAuthRequired');

  return {
    startQuiz,
    startListing,
    openChat,
    openMarketplace,
    openTerms,
    openBlog,
    openContact,
    handleSelectBlogPost,
    openSignIn,
    openAccountSettings,
    backToLanding,
    handleGetStarted,
    handleQuizComplete,
    handleAuthComplete,
    handleMarketplaceAuthRequired,
    handleMarketplaceOpenChat,
    handleQuizAuthRequired
  };
};