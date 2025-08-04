import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { ShareWithMeLogo } from "./components/ShareWithMeLogo";
import { SupportChat } from "./components/SupportChat";
import { ViewRouter } from "./components/ViewRouter";
import SafeComponentLoader from "./components/SafeComponentLoader";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { HeroSection } from "./components/landing/HeroSection";
import { FeaturesSection } from "./components/landing/FeaturesSection";
import { CTASection } from "./components/landing/CTASection";
import { Footer } from "./components/landing/Footer";
import { Sheet, SheetContent, SheetTrigger } from "./components/ui/sheet";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { updateSEO, initializeSEO } from "./lib/seo";
import { checkDevice, preventMobileZoom } from "./lib/deviceUtils";
import { ViewType, AuthMode } from "./lib/types";
import { useAuth } from "./lib/hooks/useAuth";
import { useNavigation } from "./lib/hooks/useNavigation";
import { 
  UserCheck,
  LogOut,
  User,
  Menu,
  Home,
  Search,
  Plus
} from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [selectedBlogPost, setSelectedBlogPost] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Use custom hooks
  const { user, setUser, isNewUser, setIsNewUser, loading, handleLogout, handleUserUpdate } = useAuth(currentView);
  
  const navigationHandlers = useNavigation({
    setCurrentView,
    setAuthMode,
    setSelectedBlogPost,
    setMobileMenuOpen,
    setUser,
    setIsNewUser,
    user
  });

  // Initialize SEO
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

  // Detect device capabilities
  useEffect(() => {
    try {
      const updateDeviceInfo = () => {
        const { mobile } = checkDevice();
        setIsMobile(mobile);
      };
      
      updateDeviceInfo();
      window.addEventListener('resize', updateDeviceInfo);
      return () => window.removeEventListener('resize', updateDeviceInfo);
    } catch (error) {
      console.warn('Device detection failed:', error);
    }
  }, []);

  // Mobile zoom prevention
  useEffect(() => {
    try {
      preventMobileZoom(isMobile);
    } catch (error) {
      console.warn('Mobile zoom prevention failed:', error);
    }
  }, [isMobile]);

  // Email confirmation handling
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

  // Clean navigation items - removed "How It Works"
  const navigationItems = [
    { label: 'Find Flatmates', action: navigationHandlers.startQuiz, icon: Search },
    { label: 'List Property', action: navigationHandlers.startListing, icon: Plus }
  ];

  // Loading screen
  if (loading) {
    return (
      <AppErrorBoundary>
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <ShareWithMeLogo size={isMobile ? "md" : "lg"} />
            <div className="w-6 h-6 border-2 border-stone-300 border-t-purple-500 rounded-full animate-spin mx-auto" />
            <p className="text-stone-600">Loading...</p>
          </div>
        </div>
      </AppErrorBoundary>
    );
  }

  // Route to different views
  if (currentView !== 'landing') {
    return (
      <AppErrorBoundary>
        <SafeComponentLoader 
          componentName="ViewRouter"
          onReset={navigationHandlers.backToLanding}
        >
          <ViewRouter
            currentView={currentView}
            selectedBlogPost={selectedBlogPost}
            user={user}
            isNewUser={isNewUser}
            authMode={authMode}
            onBack={navigationHandlers.backToLanding}
            onQuizComplete={navigationHandlers.handleQuizComplete}
            onQuizAuthRequired={navigationHandlers.handleQuizAuthRequired}
            onUserUpdate={handleUserUpdate}
            onAuthComplete={navigationHandlers.handleAuthComplete}
            onMarketplaceAuthRequired={navigationHandlers.handleMarketplaceAuthRequired}
            onMarketplaceOpenChat={navigationHandlers.handleMarketplaceOpenChat}
            onSelectBlogPost={navigationHandlers.handleSelectBlogPost}
            setCurrentView={setCurrentView}
          />
        </SafeComponentLoader>
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      <div className="min-h-screen bg-white text-stone-800">
        {/* Mobile-Optimized Header */}
        <header className="border-b border-stone-200 bg-white sticky top-0 z-40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <ShareWithMeLogo size={isMobile ? "sm" : "md"} />
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                {navigationItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="text-stone-600 hover:text-purple-600 transition-colors font-medium"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Desktop Auth */}
              <div className="hidden md:flex items-center space-x-3">
                {user ? (
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-emerald-700 border-emerald-200">
                      <UserCheck className="h-3 w-3 mr-1" />
                      {user.firstName}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={navigationHandlers.openAccountSettings}>
                      <User className="h-4 w-4 mr-2" />
                      Account
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button variant="ghost" onClick={navigationHandlers.openSignIn}>
                      Sign In
                    </Button>
                    <Button 
                      onClick={navigationHandlers.handleGetStarted}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile Menu with Better Touch Targets */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="sm" className="mobile-touch-target">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[300px] sm:w-[350px]">
                  <nav className="flex flex-col space-y-1 mt-8">
                    {navigationItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.action?.();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center py-4 px-4 rounded-xl text-stone-700 hover:bg-stone-100 transition-colors text-left mobile-touch-target"
                      >
                        {item.icon && <item.icon className="h-5 w-5 mr-3 text-purple-600" />}
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                    
                    <div className="border-t border-stone-200 pt-6 mt-6 space-y-3">
                      {user ? (
                        <>
                          <div className="px-4 py-2">
                            <Badge variant="outline" className="text-emerald-700 border-emerald-200">
                              <UserCheck className="h-3 w-3 mr-1" />
                              {user.firstName}
                            </Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start mobile-touch-target py-4" 
                            onClick={() => {
                              navigationHandlers.openAccountSettings();
                              setMobileMenuOpen(false);
                            }}
                          >
                            <User className="h-5 w-5 mr-3" />
                            <span className="font-medium">Account Settings</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start mobile-touch-target py-4" 
                            onClick={() => {
                              handleLogout();
                              setMobileMenuOpen(false);
                            }}
                          >
                            <LogOut className="h-5 w-5 mr-3" />
                            <span className="font-medium">Sign Out</span>
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="ghost" 
                            className="w-full mobile-touch-target py-4" 
                            onClick={() => {
                              navigationHandlers.openSignIn();
                              setMobileMenuOpen(false);
                            }}
                          >
                            <span className="font-medium">Sign In</span>
                          </Button>
                          <Button 
                            className="w-full bg-purple-600 hover:bg-purple-700 mobile-touch-target py-4" 
                            onClick={() => {
                              navigationHandlers.handleGetStarted();
                              setMobileMenuOpen(false);
                            }}
                          >
                            <span className="font-medium">Get Started</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          <HeroSection 
            isMobile={isMobile}
            isLowEndDevice={false}
            onStartQuiz={navigationHandlers.startQuiz}
            onStartListing={navigationHandlers.startListing}
          />
          
          <FeaturesSection />
          
          <CTASection 
            onStartQuiz={navigationHandlers.startQuiz}
            onOpenBlog={navigationHandlers.openBlog}
          />
        </main>

        <Footer navigationHandlers={navigationHandlers} />

        {/* Support Chat */}
        <SupportChat />
      </div>
    </AppErrorBoundary>
  );
}