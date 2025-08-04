import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { ShareWithMeLogo } from "./components/ShareWithMeLogo";
import { Hero3DIllustration } from "./components/Hero3DIllustration";
import { SupportChat } from "./components/SupportChat";
import { FloatingParticles } from "./components/FloatingParticles";
import { ViewRouter } from "./components/ViewRouter";
import { Sheet, SheetContent, SheetTrigger } from "./components/ui/sheet";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { supabase, getUserProfile, createOrGetUserProfile, isSupabaseConfigured } from "./lib/supabase";
import { updateSEO, initializeSEO } from "./lib/seo";
import { checkDevice, preventMobileZoom } from "./lib/deviceUtils";
import { navigationItems } from "./lib/constants";
import { ViewType, AuthMode, UserData } from "./lib/types";
import { 
  Home, 
  Users, 
  Shield, 
  Brain, 
  Store, 
  Clock, 
  Star,
  ArrowRight,
  CheckCircle,
  MessageCircle,
  Search,
  Sparkles,
  Zap,
  Bot,
  ShoppingBag,
  Gift,
  DollarSign,
  Percent,
  CreditCard,
  UserCheck,
  Heart,
  BookOpen,
  LogOut,
  User,
  Menu,
  X,
  Scale
} from "lucide-react";

function AppContent() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [selectedBlogPost, setSelectedBlogPost] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  // Initialize SEO on mount
  useEffect(() => {
    try {
      initializeSEO();
    } catch (error) {
      console.warn('SEO initialization failed:', error);
    }
  }, []);

  // Update SEO when view changes
  useEffect(() => {
    try {
      updateSEO(currentView);
    } catch (error) {
      console.warn('SEO update failed:', error);
    }
  }, [currentView]);

  // Detect mobile and low-end devices
  useEffect(() => {
    try {
      const updateDeviceInfo = () => {
        const { mobile, lowEnd } = checkDevice();
        setIsMobile(mobile);
        setIsLowEndDevice(lowEnd);
      };
      
      updateDeviceInfo();
      window.addEventListener('resize', updateDeviceInfo);
      return () => window.removeEventListener('resize', updateDeviceInfo);
    } catch (error) {
      console.warn('Device detection failed:', error);
    }
  }, []);

  // Optimised mouse position tracking - disabled on mobile
  useEffect(() => {
    if (isMobile) return;

    try {
      const updateMousePosition = (e: MouseEvent) => {
        // Throttle mouse tracking for better performance
        if (Date.now() % 2 === 0) {
          setMousePosition({ x: e.clientX, y: e.clientY });
        }
      };

      window.addEventListener('mousemove', updateMousePosition, { passive: true });
      return () => window.removeEventListener('mousemove', updateMousePosition);
    } catch (error) {
      console.warn('Mouse position tracking failed:', error);
    }
  }, [isMobile]);

  // Check for existing Supabase session
  useEffect(() => {
    const initialiseAuth = async () => {
      try {
        // Show development notice if Supabase is not configured
        if (!isSupabaseConfigured && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          console.log('🔧 Development Mode: Supabase not configured. The app will work with mock data.');
        }

        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session?.user?.email, 'confirmed:', session?.user?.email_confirmed_at);
        
        if (session?.user && session.user.email_confirmed_at) {
          const userProfile = await createOrGetUserProfile(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.first_name,
            session.user.user_metadata?.last_name,
            session.user.user_metadata?.phone,
            session.user.user_metadata?.age,
            session.user.user_metadata?.location,
            session.user.user_metadata?.is_verified
          );

          if (userProfile) {
            const userData: UserData = {
              id: userProfile.id,
              email: userProfile.email,
              firstName: userProfile.first_name,
              lastName: userProfile.last_name,
              phone: userProfile.phone,
              age: userProfile.age,
              location: userProfile.location,
              isVerified: userProfile.is_verified,
              profilePhotoUrl: userProfile.profile_photo_url,
              bio: userProfile.bio,
              occupation: userProfile.occupation,
              interests: userProfile.interests,
              personalityScores: userProfile.personality_scores,
              propertyPreferences: userProfile.property_preferences
            };
            setUser(userData);
            
            // Existing session users are not new users unless recently created
            const userCreatedAt = new Date(userProfile.created_at);
            const now = new Date();
            const timeDiff = now.getTime() - userCreatedAt.getTime();
            setIsNewUser(timeDiff < 300000); // 5 minutes
          }
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setLoading(false);
      }
    };

    initialiseAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email, 'confirmed:', session?.user?.email_confirmed_at);
      
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // Check if user email is confirmed
          if (!session.user.email_confirmed_at) {
            console.log('Email not confirmed yet');
            return;
          }

          // Email is confirmed, proceed with creating/getting profile
          const userProfile = await createOrGetUserProfile(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.first_name || 'User',
            session.user.user_metadata?.last_name || '',
            session.user.user_metadata?.phone,
            session.user.user_metadata?.age,
            session.user.user_metadata?.location,
            session.user.user_metadata?.is_verified || false
          );

          if (userProfile) {
            const userData: UserData = {
              id: userProfile.id,
              email: userProfile.email,
              firstName: userProfile.first_name,
              lastName: userProfile.last_name,
              phone: userProfile.phone,
              age: userProfile.age,
              location: userProfile.location,
              isVerified: userProfile.is_verified,
              profilePhotoUrl: userProfile.profile_photo_url,
              bio: userProfile.bio,
              occupation: userProfile.occupation,
              interests: userProfile.interests,
              personalityScores: userProfile.personality_scores,
              propertyPreferences: userProfile.property_preferences
            };
            setUser(userData);

            // Check if this is a newly created user (created within the last 5 minutes)
            const userCreatedAt = new Date(userProfile.created_at);
            const now = new Date();
            const timeDiff = now.getTime() - userCreatedAt.getTime();
            const isRecentlyCreated = timeDiff < 300000; // 5 minutes

            setIsNewUser(isRecentlyCreated);

            // Always redirect to chat for new signups or existing users coming from auth
            if (currentView === 'auth' || isRecentlyCreated) {
              setCurrentView('chat');
            }
          }
        } catch (error) {
          console.error('Error fetching user profile after sign in:', error);
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user?.email_confirmed_at) {
        // Handle token refresh - this can happen after email confirmation
        console.log('Token refreshed for confirmed user');
        
        // Only handle if we don't already have a user set
        if (!user) {
          try {
            const userProfile = await createOrGetUserProfile(
              session.user.id,
              session.user.email || '',
              session.user.user_metadata?.first_name || 'User',
              session.user.user_metadata?.last_name || '',
              session.user.user_metadata?.phone,
              session.user.user_metadata?.age,
              session.user.user_metadata?.location,
              session.user.user_metadata?.is_verified || false
            );

            if (userProfile) {
              const userData: UserData = {
                id: userProfile.id,
                email: userProfile.email,
                firstName: userProfile.first_name,
                lastName: userProfile.last_name,
                phone: userProfile.phone,
                age: userProfile.age,
                location: userProfile.location,
                isVerified: userProfile.is_verified,
                profilePhotoUrl: userProfile.profile_photo_url,
                bio: userProfile.bio,
                occupation: userProfile.occupation,
                interests: userProfile.interests,
                personalityScores: userProfile.personality_scores,
                propertyPreferences: userProfile.property_preferences
              };
              setUser(userData);
              setIsNewUser(true); // User just confirmed email, treat as new
              setCurrentView('chat');
            }
          } catch (error) {
            console.error('Error handling token refresh:', error);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsNewUser(false);
        setCurrentView('landing');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentView, user]);

  // Prevent zoom on inputs for mobile
  useEffect(() => {
    try {
      preventMobileZoom(isMobile);
    } catch (error) {
      console.warn('Mobile zoom prevention failed:', error);
    }
  }, [isMobile]);

  // Check for email confirmation on URL change
  useEffect(() => {
    const checkForEmailConfirmation = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log('Email confirmation detected in URL');
          
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (error) {
              console.error('Error setting session after email confirmation:', error);
            } else if (data.user) {
              console.log('Successfully set session after email confirmation');
              // Clear URL parameters
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } catch (error) {
            console.error('Exception during email confirmation:', error);
          }
        }
      } catch (error) {
        console.warn('Email confirmation check failed:', error);
      }
    };

    checkForEmailConfirmation();
  }, []);

  // Navigation handlers
  const startQuiz = () => {
    setCurrentView('quiz');
    setMobileMenuOpen(false);
  };

  const startListing = () => {
    setCurrentView('listing');
    setMobileMenuOpen(false);
  };

  const openChat = () => {
    if (user) {
      setIsNewUser(false);
      setCurrentView('chat');
    } else {
      setAuthMode('signup');
      setCurrentView('auth');
    }
    setMobileMenuOpen(false);
  };

  const openMarketplace = () => {
    if (user) {
      setIsNewUser(false);
      setCurrentView('marketplace');
    } else {
      setAuthMode('signup');
      setCurrentView('auth');
    }
    setMobileMenuOpen(false);
  };

  const openTerms = () => {
    setCurrentView('terms');
    setMobileMenuOpen(false);
  };

  const openBlog = () => {
    setCurrentView('blog');
    setMobileMenuOpen(false);
  };

  const openContact = () => {
    setCurrentView('contact');
    setMobileMenuOpen(false);
  };

  const handleSelectBlogPost = (postId: string) => {
    setSelectedBlogPost(postId);
    setCurrentView('blog-post');
  };

  const openSignIn = () => {
    setAuthMode('signin');
    setCurrentView('auth');
    setMobileMenuOpen(false);
  };

  const handleQuizComplete = () => {
    if (user) {
      setIsNewUser(false);
      setCurrentView('chat');
    } else {
      setAuthMode('signup');
      setCurrentView('auth');
    }
  };

  const handleAuthComplete = (userData: UserData, isSigningUp: boolean = false) => {
    console.log('Auth complete:', { userData, isSigningUp });
    setUser(userData);
    setIsNewUser(isSigningUp); // Only mark as new user if they just signed up
    setCurrentView('chat');
  };

  const handleMarketplaceAuthRequired = () => {
    setAuthMode('signup');
    setCurrentView('auth');
  };

  const handleMarketplaceOpenChat = (userId: string) => {
    setCurrentView('chat');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsNewUser(false);
      setCurrentView('landing');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const openAccountSettings = () => {
    setCurrentView('account-settings');
    setMobileMenuOpen(false);
  };

  const handleUserUpdate = (updatedUser: UserData) => {
    setUser(updatedUser);
  };

  const backToLanding = () => {
    setCurrentView('landing');
  };

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-purple-950/20 to-stone-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <ShareWithMeLogo size={isMobile ? "md" : "lg"} />
          <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto" />
          <p className="text-stone-600 text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  // Route to different views
  if (currentView !== 'landing') {
    return (
      <ViewRouter
        currentView={currentView}
        selectedBlogPost={selectedBlogPost}
        user={user}
        isNewUser={isNewUser}
        authMode={authMode}
        onBack={backToLanding}
        onQuizComplete={handleQuizComplete}
        onUserUpdate={handleUserUpdate}
        onAuthComplete={handleAuthComplete}
        onMarketplaceAuthRequired={handleMarketplaceAuthRequired}
        onMarketplaceOpenChat={handleMarketplaceOpenChat}
        onSelectBlogPost={handleSelectBlogPost}
        setCurrentView={setCurrentView}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-purple-950/20 to-stone-100 text-stone-800 overflow-hidden relative">
      {!isLowEndDevice && <FloatingParticles />}
      
      {/* Cursor follower - hidden on mobile */}
      {!isMobile && (
        <motion.div
          className="fixed top-0 left-0 w-4 h-4 bg-gradient-to-r from-purple-400/20 via-cyan-400/25 via-yellow-400/25 to-pink-400/20 rounded-full pointer-events-none z-30 mix-blend-difference"
          animate={{
            x: mousePosition.x - 8,
            y: mousePosition.y - 8,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      )}

      {/* Header */}
      <header 
        className="relative border-b border-stone-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-40"
        role="banner"
      >
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <ShareWithMeLogo size="md" />
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
                {navigationItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-stone-600 hover:text-purple-600 transition-colours relative group"
                    aria-label={`Navigate to ${item.label}`}
                  >
                    {item.label}
                    <motion.div
                      className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 origin-left"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </a>
                ))}
              </nav>

              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center space-x-4">
                {user ? (
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      <UserCheck className="h-3 w-3 mr-1" />
                      {user.firstName}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={openAccountSettings} aria-label="Account settings">
                      <User className="h-4 w-4 mr-2" />
                      Account
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Sign out">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button variant="ghost" onClick={openSignIn} aria-label="Sign in to your account">
                      Sign In
                    </Button>
                    <Button 
                      onClick={() => { 
                        setAuthMode('signup'); 
                        setCurrentView('auth'); 
                      }}
                      aria-label="Create new account and get started"
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="sm" aria-label="Open mobile menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <nav className="flex flex-col space-y-4 mt-4" role="navigation" aria-label="Mobile navigation">
                    {navigationItems.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        className="text-stone-600 hover:text-purple-600 transition-colours py-2"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label={`Navigate to ${item.label}`}
                      >
                        {item.label}
                      </a>
                    ))}
                    <div className="border-t pt-4 space-y-2">
                      {user ? (
                        <>
                          <div className="py-2">
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              <UserCheck className="h-3 w-3 mr-1" />
                              {user.firstName}
                            </Badge>
                          </div>
                          <Button variant="ghost" className="w-full justify-start" onClick={openAccountSettings}>
                            <User className="h-4 w-4 mr-2" />
                            Account Settings
                          </Button>
                          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" className="w-full" onClick={openSignIn}>
                            Sign In
                          </Button>
                          <Button className="w-full" onClick={() => { 
                            setAuthMode('signup'); 
                            setCurrentView('auth'); 
                            setMobileMenuOpen(false); 
                          }}>
                            Get Started
                          </Button>
                        </>
                      )}
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Main Content */}
      <main role="main">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8" aria-labelledby="hero-heading">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left Column - Content */}
              <motion.div
                className="space-y-8 text-center lg:text-left"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="space-y-6">
                  <motion.h1 
                    id="hero-heading"
                    className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                  >
                    <span className="bg-gradient-to-r from-purple-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                      Find Your Perfect
                    </span>
                    <br />
                    <span className="text-stone-900">Flatmate</span>
                  </motion.h1>
                  
                  <motion.p 
                    className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                  >
                    Australia&apos;s smartest AI-powered platform for finding compatible housemates. 
                    Match with verified users who share your lifestyle, values, and living preferences.
                  </motion.p>

                  {/* Key Benefits */}
                  <motion.div 
                    className="flex flex-wrap gap-4 justify-center lg:justify-start"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    role="list"
                    aria-label="Key platform benefits"
                  >
                    {[
                      { icon: Brain, text: "AI Personality Matching", colour: "from-purple-500 to-purple-600" },
                      { icon: Shield, text: "100% Verified Users", colour: "from-emerald-500 to-emerald-600" },
                      { icon: DollarSign, text: "Completely Free", colour: "from-cyan-500 to-cyan-600" }
                    ].map((benefit, index) => (
                      <motion.div
                        key={benefit.text}
                        className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-stone-200"
                        whileHover={{ scale: 1.05, y: -2 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        role="listitem"
                      >
                        <div className={`w-5 h-5 bg-gradient-to-r ${benefit.colour} rounded-full flex items-center justify-center`}>
                          <benefit.icon className="h-3 w-3 text-white" aria-hidden="true" />
                        </div>
                        <span className="text-stone-700 text-sm font-medium">{benefit.text}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* CTA Buttons */}
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  role="group"
                  aria-label="Main action buttons"
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      size="lg" 
                      className="text-lg px-8 py-4 bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 hover:from-purple-600 hover:via-cyan-600 hover:to-emerald-600 border-0 shadow-lg shadow-purple-500/25"
                      onClick={startQuiz}
                      aria-label="Take AI personality quiz to find compatible flatmates"
                    >
                      <Brain className="mr-2 h-5 w-5" aria-hidden="true" />
                      Take AI Quiz
                      <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="text-lg px-8 py-4 border-2 border-stone-300 hover:border-purple-400 hover:bg-purple-50"
                      onClick={startListing}
                      aria-label="List your property or spare room for free"
                    >
                      <Home className="mr-2 h-5 w-5" aria-hidden="true" />
                      List Your Property
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Getting Started Note */}
                <motion.div 
                  className="flex items-center justify-center lg:justify-start pt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                >
                  <div className="flex items-center space-x-2 text-stone-600 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                    <span>Get started in under 5 minutes • 100% secure &amp; private • Always free</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Column - Illustration */}
              <motion.div
                className="relative order-first lg:order-last"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                aria-hidden="true"
              >
                <Hero3DIllustration />
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section 
          id="ai-matching" 
          className="py-16 sm:py-24 bg-white/50 backdrop-blur-sm border-y border-stone-200/50"
          aria-labelledby="how-it-works-heading"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center space-y-4 mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 id="how-it-works-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900">
                How Our AI Finds Your Perfect Match
              </h2>
              <p className="text-lg text-stone-600 max-w-3xl mx-auto">
                Our intelligent matching algorithm analyses personality traits, lifestyle preferences, and compatibility factors
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
              {[
                {
                  step: "01",
                  title: "Take the AI Quiz",
                  description: "Answer 19 quick questions about your lifestyle, habits, and preferences. Our AI analyses your personality profile.",
                  icon: Brain,
                  colour: "from-purple-500 to-purple-600"
                },
                {
                  step: "02", 
                  title: "Get Smart Matches",
                  description: "Our algorithm finds compatible flatmates based on personality compatibility, cleanliness, social preferences, and more.",
                  icon: Zap,
                  colour: "from-cyan-500 to-cyan-600"
                },
                {
                  step: "03",
                  title: "Connect Safely",
                  description: "Chat with verified matches, view compatibility scores, and meet potential flatmates before deciding.",
                  icon: MessageCircle,
                  colour: "from-emerald-500 to-emerald-600"
                }
              ].map((step, index) => (
                <motion.article
                  key={step.step}
                  className="relative"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.8 }}
                  aria-labelledby={`step-${step.step}-title`}
                >
                  <Card className="p-8 h-full bg-white/70 backdrop-blur-sm border-stone-200 hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="space-y-6 p-0">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${step.colour} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <step.icon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                        <span className="text-4xl font-bold text-stone-200 group-hover:text-stone-300 transition-colours" aria-hidden="true">
                          {step.step}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 
                          id={`step-${step.step}-title`}
                          className="text-xl font-semibold text-stone-900 group-hover:text-purple-700 transition-colours"
                        >
                          {step.title}
                        </h3>
                        <p className="text-stone-600 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Connection Line */}
                  {index < 2 && (
                    <div className="hidden lg:block absolute top-16 -right-6 w-12 h-0.5 bg-gradient-to-r from-stone-200 to-stone-300" aria-hidden="true" />
                  )}
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section 
          id="community" 
          className="py-16 sm:py-24 bg-gradient-to-br from-purple-50 via-cyan-50 to-emerald-50"
          aria-labelledby="features-heading"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center space-y-4 mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 id="features-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900">
                Everything you need in one platform
              </h2>
              <p className="text-lg text-stone-600 max-w-3xl mx-auto">
                From finding flatmates to trading household items, we&apos;ve built a complete ecosystem for sharehouse living
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Brain,
                  title: "AI Personality Matching",
                  description: "Advanced algorithms match you with compatible flatmates based on lifestyle, cleanliness, and social preferences.",
                  colour: "from-purple-500 to-purple-600",
                  action: "Take Quiz",
                  onClick: startQuiz,
                  ariaLabel: "Take AI personality quiz for flatmate matching"
                },
                {
                  icon: Shield,
                  title: "Verified Community",
                  description: "Every user is ID-verified and background checked. Chat safely with genuine people looking for housing.",
                  colour: "from-emerald-500 to-emerald-600",
                  action: "Learn More",
                  onClick: () => {},
                  ariaLabel: "Learn more about user verification"
                },
                {
                  icon: MessageCircle,
                  title: "Secure Messaging",
                  description: "Built-in chat system to connect with potential flatmates. Share photos, ask questions, and plan meetups.",
                  colour: "from-cyan-500 to-cyan-600",
                  action: "Start Chatting",
                  onClick: openChat,
                  ariaLabel: "Start chatting with potential flatmates"
                },
                {
                  icon: Home,
                  title: "Free Property Listings",
                  description: "List your spare rooms or properties completely free. No commission fees, no hidden costs, ever.",
                  colour: "from-orange-500 to-orange-600",
                  action: "List Your Property",
                  onClick: startListing,
                  ariaLabel: "List your property or spare room"
                },
                {
                  icon: ShoppingBag,
                  title: "Community Marketplace",
                  description: "Buy and sell household items with your flatmate community. Furniture, appliances, and more.",
                  colour: "from-pink-500 to-pink-600",
                  action: "Browse Marketplace",
                  onClick: openMarketplace,
                  ariaLabel: "Browse community marketplace"
                },
                {
                  icon: BookOpen,
                  title: "Expert Guides",
                  description: "Comprehensive guides on sharehouse living, renting tips, and moving advice for Australian renters.",
                  colour: "from-indigo-500 to-indigo-600",
                  action: "Read Guides",
                  onClick: openBlog,
                  ariaLabel: "Read expert guides and tips"
                }
              ].map((feature, index) => (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -5 }}
                  className="group"
                  aria-labelledby={`feature-${index}-title`}
                >
                  <Card className="p-6 h-full bg-white/80 backdrop-blur-sm border-stone-200 hover:shadow-xl transition-all duration-300">
                    <CardContent className="space-y-4 p-0">
                      <div className={`w-12 h-12 bg-gradient-to-r ${feature.colour} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      
                      <div className="space-y-3">
                        <h3 
                          id={`feature-${index}-title`}
                          className="text-xl font-semibold text-stone-900 group-hover:text-purple-700 transition-colours"
                        >
                          {feature.title}
                        </h3>
                        <p className="text-stone-600 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start p-0 h-auto font-medium text-purple-600 hover:text-purple-700 hover:bg-transparent group-hover:translate-x-1 transition-transform duration-200"
                        onClick={feature.onClick}
                        aria-label={feature.ariaLabel}
                      >
                        {feature.action}
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section 
          id="pricing" 
          className="py-16 sm:py-24"
          aria-labelledby="pricing-heading"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center space-y-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-4">
                <h2 id="pricing-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900">
                  Simple, transparent pricing
                </h2>
                <p className="text-lg text-stone-600 max-w-3xl mx-auto">
                  Everything is completely free. No hidden fees, no commissions, no surprises.
                </p>
              </div>

              {/* Free Plan Highlight */}
              <motion.article
                className="max-w-lg mx-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
                aria-labelledby="free-plan-title"
              >
                <Card className="p-8 bg-gradient-to-br from-purple-50 via-cyan-50 to-emerald-50 border-2 border-purple-200 shadow-xl">
                  <CardContent className="space-y-6 p-0">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <Gift className="h-6 w-6 text-purple-600" aria-hidden="true" />
                        <h3 id="free-plan-title" className="text-2xl font-bold text-stone-900">Free Forever</h3>
                      </div>
                      <p className="text-stone-600">Everything you need, always free</p>
                    </div>
                    
                    <div className="text-center py-4">
                      <div className="text-5xl font-bold text-stone-900">$0</div>
                      <div className="text-stone-600">No fees, ever</div>
                    </div>
                    
                    <ul className="space-y-3" role="list" aria-label="Free plan features">
                      {[
                        "AI personality matching",
                        "Unlimited messaging",
                        "Property listings",
                        "Community marketplace",
                        "Expert guides & resources",
                        "ID verification included",
                        "Customer support"
                      ].map((feature, index) => (
                        <motion.li
                          key={feature}
                          className="flex items-center space-x-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          role="listitem"
                        >
                          <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                          <span className="text-stone-700">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                    
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 hover:from-purple-600 hover:via-cyan-600 hover:to-emerald-600 border-0 shadow-lg"
                        onClick={startQuiz}
                        aria-label="Get started free with AI personality quiz"
                      >
                        Get Started Free
                        <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.article>

              {/* Why Free? */}
              <motion.aside
                className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-stone-200"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
                aria-labelledby="why-free-heading"
              >
                <div className="space-y-4">
                  <h3 id="why-free-heading" className="text-2xl font-bold text-stone-900">Why is Share With Me free?</h3>
                  <p className="text-stone-600 leading-relaxed max-w-3xl mx-auto">
                    We believe everyone deserves access to safe, compatible housing. By keeping our platform free, 
                    we&apos;re helping create stronger communities and making it easier for people to find their perfect living situation. 
                    Our mission is to connect people, not to profit from housing stress.
                  </p>
                </div>
              </motion.aside>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section 
          className="py-16 sm:py-24 bg-gradient-to-br from-purple-900 via-cyan-900 to-emerald-900 text-white relative overflow-hidden"
          aria-labelledby="cta-heading"
        >
          {/* Simple CSS pattern background instead of problematic SVG */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)',
              backgroundSize: '30px 30px'
            }}
            aria-hidden="true"
          />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              className="text-center space-y-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-4">
                <h2 id="cta-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                  Ready to find your perfect flatmate?
                </h2>
                <p className="text-xl text-white/80 max-w-2xl mx-auto">
                  Join thousands of Australians who are finding their ideal living situation through Share With Me
                </p>
              </div>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
                role="group"
                aria-label="Call to action buttons"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-4 bg-white text-purple-600 hover:bg-white/90 border-0 shadow-lg font-medium"
                    onClick={startQuiz}
                    aria-label="Take AI personality quiz now to find compatible flatmates"
                  >
                    <Brain className="mr-2 h-5 w-5" aria-hidden="true" />
                    Take AI Quiz Now
                    <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="text-lg px-8 py-4 border-2 border-white/70 bg-white/10 text-white hover:bg-white/20 hover:border-white font-medium backdrop-blur-sm"
                    onClick={startListing}
                    aria-label="List your property for free"
                  >
                    <Home className="mr-2 h-5 w-5" aria-hidden="true" />
                    List Your Property
                  </Button>
                </motion.div>
              </motion.div>

              <motion.p 
                className="text-white/60 text-sm"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                🚀 Get started in under 5 minutes • 🔒 100% secure &amp; private • 💰 Always free
              </motion.p>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-white py-12 border-t border-stone-800" role="contentinfo">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            <div className="space-y-4">
              <ShareWithMeLogo size="sm" />
              <p className="text-stone-400 leading-relaxed">
                Australia&apos;s smartest AI-powered flatmate matching platform. 
                Find compatible housemates and build better communities.
              </p>
              <address className="text-stone-400 text-sm not-italic">
                Level 5, 126 Phillip Street<br />
                Sydney NSW 2000, Australia<br />
                <a href="mailto:hello@sharewithme.io" className="hover:text-white transition-colours">
                  hello@sharewithme.io
                </a>
              </address>
            </div>
            
            <nav className="space-y-4" aria-label="Footer platform links">
              <h3 className="font-semibold">Platform</h3>
              <ul className="space-y-2 text-stone-400">
                <li><button onClick={startQuiz} className="hover:text-white transition-colours">AI Matching</button></li>
                <li><button onClick={startListing} className="hover:text-white transition-colours">List Your Property</button></li>
                <li><button onClick={openMarketplace} className="hover:text-white transition-colours">Marketplace</button></li>
                <li><button onClick={openBlog} className="hover:text-white transition-colours">Blog &amp; Guides</button></li>
              </ul>
            </nav>
            
            <nav className="space-y-4" aria-label="Footer support links">
              <h3 className="font-semibold">Support</h3>
              <ul className="space-y-2 text-stone-400">
                <li><button onClick={openContact} className="hover:text-white transition-colours">Contact Us</button></li>
                <li><button onClick={openTerms} className="hover:text-white transition-colours">Terms of Service</button></li>
                <li><a href="mailto:hello@sharewithme.io" className="hover:text-white transition-colours">hello@sharewithme.io</a></li>
              </ul>
            </nav>
          </div>
          
          <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-stone-400 text-sm">
              © 2025 Share With Me. All rights reserved. ABN 94 665 657 027
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Badge variant="secondary" className="bg-emerald-900/50 text-emerald-300 border-emerald-400/30">
                <Shield className="h-3 w-3 mr-1" aria-hidden="true" />
                100% Free Platform
              </Badge>
              <Badge variant="secondary" className="bg-purple-900/50 text-purple-300 border-purple-400/30">
                <Brain className="h-3 w-3 mr-1" aria-hidden="true" />
                AI-Powered Matching
              </Badge>
            </div>
          </div>
        </div>
      </footer>

      <SupportChat user={user} />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}