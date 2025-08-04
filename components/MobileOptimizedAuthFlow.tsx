import React, { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Progress } from "./ui/progress";
import { ShareWithMeLogo } from "./ShareWithMeLogo";
import { AuthService, AuthUser } from "../lib/authService";
import { useOptimizedUpload } from "../lib/fileUpload";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";

// Import our refactored components and helpers
import { SIGNUP_STEPS, UPLOAD_CONFIG } from "./auth/constants";
import { 
  FormData, 
  validateFormStep, 
  validateSignupData, 
  enhanceErrorMessage, 
  handleExceptionError, 
  prepareUserData, 
  logUserDataForDebug,
  debugAuthError
} from "./auth/helpers";
import { EmailConfirmationScreen } from "./auth/EmailConfirmationScreen";
import { 
  PersonalDetailsStep, 
  IdentityVerificationStep, 
  AccountSecurityStep 
} from "./auth/SignupSteps";

interface MobileOptimizedAuthFlowProps {
  onBack: () => void;
  onAuthComplete: (userData: AuthUser, isSigningUp?: boolean) => void;
  mode?: 'signin' | 'signup';
}

export const MobileOptimizedAuthFlow = ({ 
  onBack, 
  onAuthComplete, 
  mode: initialMode = 'signup' 
}: MobileOptimizedAuthFlowProps) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [idVerified, setIdVerified] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('online');
  const [retryCount, setRetryCount] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    age: '',
    location: '',
    agreeToTerms: false,
    agreeToIdVerification: false,
    idDocument: null,
  });

  const { uploadFile } = useOptimizedUpload();

  // Check network connectivity
  const checkConnection = useCallback(async () => {
    setConnectionStatus('checking');
    try {
      const testResult = await AuthService.testConnection();
      setConnectionStatus(testResult.connected ? 'online' : 'offline');
      return testResult.connected;
    } catch (error) {
      console.error('Connection check failed:', error);
      setConnectionStatus('offline');
      return false;
    }
  }, []);

  const handleInputChange = useCallback((field: keyof FormData, value: any) => {
    setError(null);
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setUploadProgress(0);
      setError(null);
      
      console.log('📤 Starting ID document upload:', file.name, file.type, file.size);

      const mockUpload = async (preparedFile: File): Promise<string> => {
        return new Promise((resolve) => {
          const uploadTime = Math.min(Math.max(file.size / 100000, 500), 3000);
          setTimeout(() => {
            const mockUrl = `https://mock-storage.example.com/id-documents/${Date.now()}-${preparedFile.name}`;
            console.log('✅ Mock upload completed:', mockUrl);
            resolve(mockUrl);
          }, uploadTime);
        });
      };

      await uploadFile(
        file,
        mockUpload,
        (progress) => {
          setUploadProgress(progress);
          console.log('📊 Upload progress:', progress + '%');
        }
      );

      handleInputChange('idDocument', file);
      setIdVerified(true);
      setUploadProgress(UPLOAD_CONFIG.MAX_PROGRESS);

      console.log('✅ ID document uploaded successfully');
      setTimeout(() => setUploadProgress(0), UPLOAD_CONFIG.PROGRESS_CLEAR_DELAY);
      
    } catch (error) {
      console.error('❌ ID document upload failed:', error);
      setIdVerified(false);
      setUploadProgress(0);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload ID document. Please try again.';
      setError(errorMessage);
    }
  }, [uploadFile, handleInputChange]);

  const isStepValid = useCallback(() => {
    return validateFormStep(formData, currentStep, idVerified, mode);
  }, [mode, formData, currentStep, idVerified]);

  const handleSignIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log('🔐 Starting sign in process');

    try {
      // Check connectivity first
      const isConnected = await checkConnection();
      if (!isConnected) {
        setError('No internet connection. Please check your connection and try again.');
        setIsLoading(false);
        return;
      }

      const { user, error } = await AuthService.signIn(formData.email, formData.password);

      if (error) {
        console.error('❌ Sign in failed:', error);
        debugAuthError(error, 'Sign In');
        setError(error.message);
        return;
      }

      if (user) {
        console.log('✅ Sign in successful:', user.email);
        onAuthComplete(user, false);
      } else {
        setError('Sign in failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      debugAuthError(error, 'Sign In Exception');
      setError(handleExceptionError(error));
    } finally {
      setIsLoading(false);
    }
  }, [formData.email, formData.password, onAuthComplete, checkConnection]);

  const handleSignUp = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
    
    console.log(`🔐 Starting sign up process (attempt ${retryCount + 1}) for:`, formData.email);

    try {
      // Pre-flight validation
      const validationError = validateSignupData(formData, idVerified);
      if (validationError) {
        console.log('❌ Client-side validation failed:', validationError);
        setError(validationError);
        setIsLoading(false);
        return;
      }

      // Check connectivity
      const isConnected = await checkConnection();
      if (!isConnected) {
        setError('No internet connection. Please check your connection and try again.');
        setIsLoading(false);
        return;
      }

      console.log('✅ Pre-flight checks passed, preparing user data');
      
      const userData = prepareUserData(formData);
      logUserDataForDebug(userData);

      console.log('🚀 Calling AuthService.signUp...');
      const { user, error, needsEmailConfirmation } = await AuthService.signUp(userData);

      if (error) {
        console.error('❌ Sign up failed with error:', error);
        debugAuthError(error, 'Sign Up');
        
        const enhancedError = enhanceErrorMessage(error);
        setError(enhancedError);
        
        // Add retry suggestion for certain errors
        if (error.code === 'network_error' || error.code === 'timeout_error') {
          setError(`${enhancedError} (Attempt ${retryCount + 1}/3)`);
        }
        
        return;
      }

      if (needsEmailConfirmation) {
        console.log('📧 Email confirmation required, showing confirmation screen');
        setShowEmailConfirmation(true);
        return;
      }

      if (user) {
        console.log('✅ Sign up successful for:', user.email);
        setRetryCount(0); // Reset retry count on success
        onAuthComplete(user, true);
      } else {
        console.error('❌ Sign up completed but no user returned');
        setError('Account creation completed but something went wrong. Please try signing in instead.');
      }

    } catch (error) {
      console.error('❌ Sign up exception:', error);
      debugAuthError(error, 'Sign Up Exception');
      
      const enhancedError = handleExceptionError(error);
      setError(`${enhancedError} (Attempt ${retryCount + 1}/3)`);
    } finally {
      setIsLoading(false);
    }
  }, [formData, onAuthComplete, idVerified, retryCount, checkConnection]);

  const handleRetry = useCallback(async () => {
    if (mode === 'signin') {
      await handleSignIn();
    } else {
      await handleSignUp();
    }
  }, [mode, handleSignIn, handleSignUp]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Form submitted, mode:', mode);
    
    if (mode === 'signin') {
      await handleSignIn();
    } else {
      await handleSignUp();
    }
  }, [mode, handleSignIn, handleSignUp]);

  const nextStep = () => {
    if (currentStep < SIGNUP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  if (showEmailConfirmation) {
    return (
      <EmailConfirmationScreen 
        email={formData.email}
        onBack={() => setShowEmailConfirmation(false)}
        onError={setError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="mobile-touch-target">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          <ShareWithMeLogo size="sm" />
          <div className="flex items-center space-x-2">
            {/* Connection Status Indicator */}
            {connectionStatus === 'offline' ? (
              <WifiOff className="h-4 w-4 text-red-500" />
            ) : connectionStatus === 'checking' ? (
              <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />
            ) : (
              <Wifi className="h-4 w-4 text-emerald-500" />
            )}
          </div>
        </div>
      </header>

      {/* Progress Bar (Signup only) */}
      {mode === 'signup' && (
        <div className="px-4 py-4 bg-stone-50 border-b border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-stone-600">
              Step {currentStep + 1} of {SIGNUP_STEPS.length}
            </span>
            <span className="text-sm text-stone-600">
              {SIGNUP_STEPS[currentStep].title}
            </span>
          </div>
          <Progress value={((currentStep + 1) / SIGNUP_STEPS.length) * 100} className="h-2" />
        </div>
      )}

      {/* Form Content */}
      <div className="px-4 py-6">
        <motion.div
          key={mode + currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-md mx-auto"
        >
          <Card className="shadow-minimal border-stone-200">
            <CardHeader className="text-center pb-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                {mode === 'signin' ? (
                  <Lock className="h-6 w-6 text-purple-600" />
                ) : (
                  (() => {
                    const IconComponent = SIGNUP_STEPS[currentStep].icon;
                    return <IconComponent className="h-6 w-6 text-purple-600" />;
                  })()
                )}
              </div>
              <h1 className="text-xl font-semibold text-stone-900">
                {mode === 'signin' ? 'Welcome Back' : SIGNUP_STEPS[currentStep].title}
              </h1>
              <p className="text-stone-600 mt-1">
                {mode === 'signin' 
                  ? 'Sign in to your account' 
                  : 'Complete your profile to get started'
                }
              </p>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-start justify-between">
                    <span className="flex-1">{error}</span>
                    {(error.includes('network') || error.includes('connection') || error.includes('timeout')) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRetry}
                        disabled={isLoading}
                        className="ml-2 px-2 py-1 h-auto text-xs"
                      >
                        {isLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Retry'}
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {connectionStatus === 'offline' && (
                <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                  <WifiOff className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Connection lost. Please check your internet and try again.
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={checkConnection}
                      disabled={connectionStatus === 'checking'}
                      className="ml-2 px-2 py-1 h-auto text-xs text-yellow-700"
                    >
                      {connectionStatus === 'checking' ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Check'}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signin' ? (
                  // Sign In Form
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="mobile-touch-target"
                        autoComplete="email"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="mobile-touch-target pr-12"
                          autoComplete="current-password"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full mobile-touch-target bg-purple-600 hover:bg-purple-700"
                      disabled={!isStepValid() || isLoading || connectionStatus === 'offline'}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Sign In
                    </Button>

                    <div className="text-center">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setMode('signup')}
                        className="text-purple-600"
                      >
                        Don't have an account? Sign up
                      </Button>
                    </div>
                  </>
                ) : (
                  // Sign Up Form
                  <>
                    {currentStep === 0 && (
                      <PersonalDetailsStep 
                        formData={formData} 
                        onInputChange={handleInputChange} 
                      />
                    )}

                    {currentStep === 1 && (
                      <IdentityVerificationStep 
                        formData={formData} 
                        onInputChange={handleInputChange}
                        idVerified={idVerified}
                        uploadProgress={uploadProgress}
                        onFileUpload={handleFileUpload}
                      />
                    )}

                    {currentStep === 2 && (
                      <AccountSecurityStep 
                        formData={formData} 
                        onInputChange={handleInputChange}
                        showPassword={showPassword}
                        onTogglePassword={() => setShowPassword(!showPassword)}
                      />
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 pt-4">
                      {currentStep > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          className="flex-1 mobile-touch-target"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back
                        </Button>
                      )}

                      {currentStep < SIGNUP_STEPS.length - 1 ? (
                        <Button
                          type="button"
                          onClick={nextStep}
                          disabled={!isStepValid()}
                          className="flex-1 mobile-touch-target bg-purple-600 hover:bg-purple-700"
                        >
                          Continue
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={!isStepValid() || isLoading || connectionStatus === 'offline'}
                          className="flex-1 mobile-touch-target bg-purple-600 hover:bg-purple-700"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Create Account
                        </Button>
                      )}
                    </div>

                    <div className="text-center pt-4">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setMode('signin')}
                        className="text-purple-600"
                      >
                        Already have an account? Sign in
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default MobileOptimizedAuthFlow;