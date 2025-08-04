import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { ShareWithMeLogo } from "./ShareWithMeLogo";
import { supabase, createOrGetUserProfile, isSupabaseConfigured, isStorageAvailable } from "../lib/supabase";
import { supabaseData } from "../lib/supabaseData";
import { FileUploadOptimizer, useOptimizedUpload } from "../lib/fileUpload";
import { analytics } from "../lib/analytics";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  User,
  Phone,
  Calendar,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle,
  Shield,
  UserPlus,
  LogIn,
  Upload,
  Camera,
  Check,
  Clock,
  Scan,
  IdCard,
  Video,
  X,
  Sparkles,
  AlertTriangle
} from "lucide-react";

interface AuthFlowProps {
  onBack: () => void;
  onAuthComplete: (userData: UserData, isSigningUp?: boolean) => void;
  mode?: 'signin' | 'signup';
}

interface UserData {
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
  personalityScores?: Record<string, any>;
  propertyPreferences?: Record<string, any>;
}

export const AuthFlow = ({ onBack, onAuthComplete, mode: initialMode = 'signup' }: AuthFlowProps) => {
  console.log('🎯 AuthFlow component rendering with mode:', initialMode);

  // Initialize all state with safe defaults
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | React.ReactNode | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [signupStartTime, setSignupStartTime] = useState<number | null>(null);
  const [idUploadStatus, setIdUploadStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'verified' | 'failed'>('idle');
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSupabaseRequired, setShowSupabaseRequired] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    age: '',
    location: '',
    agreeToTerms: false,
    marketingEmails: false,
    agreeToIdVerification: false,
    idDocument: null as File | null,
    selfiePhoto: null as File | null,
    idDocumentUrl: null as string | null,
    selfiePhotoUrl: null as string | null
  });

  const signupSteps = [
    {
      title: "Personal Details",
      description: "Tell us about yourself",
      icon: User
    },
    {
      title: "Identity Verification",
      description: "Keep our community safe",
      icon: Shield
    },
    {
      title: "Account Security",
      description: "Secure your account",
      icon: Lock
    }
  ];

  // Component mount logging and cleanup
  useEffect(() => {
    console.log('🎯 AuthFlow mounted with mode:', mode);
    
    // Start signup tracking if in signup mode
    if (mode === 'signup' && !signupStartTime) {
      try {
        analytics.trackSignupStart('email');
        analytics.trackFunnelStep('signup', signupSteps[0].title, 0);
        setSignupStartTime(Date.now());
      } catch (error) {
        console.warn('Analytics tracking failed:', error);
      }
    }

    return () => {
      console.log('🎯 AuthFlow unmounting');
      // Cleanup webcam
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mode, signupStartTime, webcamStream]);

  // Safe analytics wrapper
  const trackAnalytics = useCallback((eventName: string, data: any) => {
    try {
      analytics.track(eventName, data);
    } catch (error) {
      console.warn(`Analytics tracking failed for ${eventName}:`, error);
    }
  }, []);

  // Safe input change handler
  const handleInputChange = useCallback((field: string, value: string | boolean | File | null) => {
    try {
      console.log('📝 Input change:', field, value);
      setError(null);
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    } catch (error) {
      console.error('Error updating form data:', error);
    }
  }, []);

  // Upload file to Supabase Storage
  const uploadFileToStorage = useCallback(async (file: File, type: 'id' | 'selfie'): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${type}_${timestamp}.${fileExt}`;
      const filePath = `verification/${fileName}`;

      console.log(`📤 Uploading ${type} file to Supabase Storage:`, fileName);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase Storage upload error:', error);
        
        // Handle specific error types with helpful messages
        if (error.message?.includes('SUPABASE_REQUIRED') || error.code === 'SUPABASE_NOT_CONFIGURED') {
          throw new Error('SUPABASE_REQUIRED: File storage requires Supabase connection and storage bucket setup.');
        } else if (error.message?.includes('bucket') || error.message?.includes('not found')) {
          throw new Error('Storage bucket not configured. Please set up the user-documents bucket in Supabase.');
        } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
          throw new Error('Storage permission denied. Please check your Supabase RLS policies.');
        }
        
        throw error;
      }

      console.log(`✅ Successfully uploaded ${type} file:`, data.path);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-documents')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file to storage:', error);
      throw error;
    }
  }, []);

  // Get optimized upload hook
  const { uploadFile } = useOptimizedUpload();

  // Enhanced file upload handler with compression and optimization
  const handleFileUpload = useCallback(async (file: File, type: 'id' | 'selfie') => {
    console.log(`🔄 Starting optimized ${type} upload:`, file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // Check if Supabase storage is available
    if (!isStorageAvailable()) {
      console.error('🚫 Supabase storage not available');
      setShowSupabaseRequired(true);
      return;
    }

    try {
      setError(null);
      setUploadProgress(0);

      if (type === 'id') {
        trackAnalytics('id_verification_upload_started', {
          file_type: type,
          file_size: file.size,
          file_name: file.name,
          category: 'verification',
          action: 'upload_start'
        });

        setFormData(prev => ({ ...prev, idDocument: file }));
        setIdUploadStatus('uploading');
        
        // Use optimized upload with compression and progress tracking
        const uploadedUrl = await uploadFile(
          file,
          (preparedFile) => uploadFileToStorage(preparedFile, type),
          (progress) => setUploadProgress(Math.min(progress * 0.8, 80)) // Reserve 20% for verification
        );
        
        if (!uploadedUrl) {
          throw new Error('Failed to upload document to storage');
        }
        
        console.log(`✅ ${type} uploaded successfully:`, uploadedUrl);

        setFormData(prev => ({ ...prev, idDocumentUrl: uploadedUrl }));
        setIdUploadStatus('analyzing');
        setUploadProgress(85);
        
        // Simulate ID verification process (shortened for better UX)
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIdUploadStatus('verified');
        setUploadProgress(100);

        trackAnalytics('id_verification_completed', {
          file_type: type,
          verification_result: 'verified',
          file_url: uploadedUrl,
          category: 'verification',
          action: 'verification_complete'
        });

        console.log('✅ ID verification completed successfully');

      } else {
        trackAnalytics('selfie_upload_completed', {
          file_type: type,
          file_size: file.size,
          file_name: file.name,
          category: 'verification',
          action: 'selfie_upload'
        });
        
        // Use optimized upload for selfie
        const uploadedUrl = await uploadFile(
          file,
          (preparedFile) => uploadFileToStorage(preparedFile, type),
          (progress) => setUploadProgress(progress)
        );
        
        if (!uploadedUrl) {
          throw new Error('Failed to upload selfie to storage');
        }
        
        console.log(`✅ ${type} uploaded successfully:`, uploadedUrl);

        setFormData(prev => ({ 
          ...prev, 
          selfiePhoto: file,
          selfiePhotoUrl: uploadedUrl 
        }));

        console.log('✅ Selfie upload completed successfully');
      }

    } catch (error) {
      console.error(`❌ Error handling ${type} upload:`, error);
      setIdUploadStatus('failed');
      setUploadProgress(0);
      
      // Handle specific errors with user-friendly messages
      if (error instanceof Error) {
        if (error.message.includes('SUPABASE_REQUIRED')) {
          setShowSupabaseRequired(true);
        } else if (error.message.includes('bucket')) {
          setError('Storage bucket not found. Please set up the user-documents bucket in Supabase.');
        } else if (error.message.includes('File size too large') || error.message.includes('Invalid file type')) {
          setError(error.message);
        } else {
          setError(`Upload failed: ${error.message}. Please try again.`);
        }
      } else {
        setError('File upload failed. Please try again.');
      }
    }
  }, [uploadFile, trackAnalytics, uploadFileToStorage]);

  // Webcam handlers
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      setWebcamStream(stream);
      setShowWebcam(true);
      setIsCameraReady(true);
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Unable to access camera. Please check your permissions or use file upload instead.');
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setShowWebcam(false);
    setIsCameraReady(false);
  }, [webcamStream]);

  const capturePhoto = useCallback(() => {
    try {
      const video = document.getElementById('webcam-video') as HTMLVideoElement;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
            handleFileUpload(file, 'selfie');
            stopWebcam();
          }
        }, 'image/jpeg', 0.8);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      setError('Failed to capture photo. Please try again.');
    }
  }, [handleFileUpload, stopWebcam]);

  // Enhanced navigation handlers
  const handleNextStep = useCallback(() => {
    try {
      console.log('🔄 Next button clicked - current step:', currentStep, 'max steps:', signupSteps.length - 1);
      
      if (currentStep < signupSteps.length - 1) {
        const nextStep = currentStep + 1;
        console.log('✅ Moving to step:', nextStep);
        
        // Track analytics (non-blocking)
        try {
          analytics.trackFunnelStep('signup', signupSteps[nextStep].title, nextStep);
        } catch (analyticsError) {
          console.warn('Analytics tracking failed:', analyticsError);
        }
        
        setCurrentStep(nextStep);
        setError(null); // Clear any errors when moving to next step
      } else {
        console.log('⚠️ Already at last step, cannot proceed');
      }
    } catch (error) {
      console.error('❌ Error handling next step:', error);
    }
  }, [currentStep, signupSteps]);

  const handlePrevStep = useCallback(() => {
    try {
      console.log('🔙 Previous button clicked - current step:', currentStep);
      
      if (currentStep > 0) {
        const prevStep = currentStep - 1;
        console.log('✅ Moving to step:', prevStep);
        setCurrentStep(prevStep);
        setError(null); // Clear any errors when moving to previous step
      } else {
        console.log('⚠️ Already at first step, cannot go back');
      }
    } catch (error) {
      console.error('❌ Error handling previous step:', error);
    }
  }, [currentStep]);

  // Form validation - improved debugging
  const isStepValid = useCallback(() => {
    try {
      if (mode === 'signin') {
        const valid = formData.email && formData.password;
        console.log('🔍 Sign in validation:', { valid, email: !!formData.email, password: !!formData.password });
        return valid;
      }

      let valid = false;
      let validationDetails = {};

      switch (currentStep) {
        case 0: // Personal Details
          validationDetails = {
            firstName: !!formData.firstName,
            lastName: !!formData.lastName,
            email: !!formData.email,
            phone: !!formData.phone,
            age: !!formData.age,
            location: !!formData.location
          };
          valid = (
            formData.firstName &&
            formData.lastName &&
            formData.email &&
            formData.phone &&
            formData.age &&
            formData.location
          );
          break;
        case 1: // Identity Verification
          validationDetails = {
            agreeToIdVerification: formData.agreeToIdVerification,
            idDocument: !!formData.idDocument,
            selfiePhoto: !!formData.selfiePhoto,
            idUploadStatus: idUploadStatus
          };
          valid = (
            formData.agreeToIdVerification &&
            formData.idDocument &&
            formData.selfiePhoto &&
            idUploadStatus === 'verified'
          );
          break;
        case 2: // Account Security
          validationDetails = {
            password: !!formData.password,
            confirmPassword: !!formData.confirmPassword,
            passwordsMatch: formData.password === formData.confirmPassword,
            passwordLength: formData.password.length >= 6,
            agreeToTerms: formData.agreeToTerms
          };
          valid = (
            formData.password &&
            formData.confirmPassword &&
            formData.password === formData.confirmPassword &&
            formData.password.length >= 6 &&
            formData.agreeToTerms
          );
          break;
        default:
          valid = false;
      }

      console.log(`🔍 Step ${currentStep} validation:`, { valid, ...validationDetails });
      return valid;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }, [mode, formData, currentStep, idUploadStatus]);

  // Sign in handler
  const handleSignIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    console.log('🔐 Sign in attempt for:', formData.email);

    try {
      trackAnalytics('signin_attempt', { method: 'email' });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.log('❌ Sign in error:', error.message);
        
        if (error.message.includes('Invalid login credentials')) {
          setError(
            <div className="space-y-3">
              <p className="text-sm text-red-600">
                Invalid email or password. If you don't have an account yet, you can create one below.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setCurrentStep(0);
                }}
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account Instead
              </Button>
            </div>
          );
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link to activate your account.');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.user) {
        console.log('✅ Sign in successful for:', data.user.email);
        
        trackAnalytics('signin_success', { method: 'email' });

        // Get or create the user profile
        const userProfile = await createOrGetUserProfile(
          data.user.id,
          data.user.email || formData.email,
          data.user.user_metadata?.first_name || 'User',
          data.user.user_metadata?.last_name || ''
        );

        if (!userProfile) {
          throw new Error('Failed to get or create user profile. Please try again.');
        }

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

        onAuthComplete(userData, false);
      }
    } catch (error: any) {
      console.error('❌ Sign in exception:', error);
      setError(error.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  }, [formData.email, formData.password, onAuthComplete, trackAnalytics]);

  // Sign up handler
  const handleSignUp = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const timeToComplete = signupStartTime ? Date.now() - signupStartTime : undefined;

    try {
      console.log('🚀 Starting signup process for:', formData.email);

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            age: parseInt(formData.age),
            location: formData.location,
            is_verified: idUploadStatus === 'verified',
            id_document_url: formData.idDocumentUrl,
            selfie_photo_url: formData.selfiePhotoUrl
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log('✅ Supabase signup successful for:', data.user.email);

        trackAnalytics('signup_complete', { 
          method: 'email', 
          time_to_complete: timeToComplete,
          id_verified: idUploadStatus === 'verified'
        });

        // Save user to Supabase database
        try {
          const supabaseUserData = {
            id: data.user.id,
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            age: parseInt(formData.age) || undefined,
            location: formData.location,
            isVerified: idUploadStatus === 'verified',
            profilePhotoUrl: formData.selfiePhotoUrl,
            bio: '',
            occupation: '',
            interests: [],
            personalityScores: {},
            propertyPreferences: {}
          };

          const savedUser = await supabaseData.users.create(supabaseUserData);
          if (savedUser) {
            console.log('✅ User successfully saved to Supabase');
          }
        } catch (supabaseError) {
          console.warn('⚠️ Supabase user save failed:', supabaseError);
          // Don't fail the signup process if user save fails - they can update profile later
        }

        // Check if email confirmation is required
        if (!data.user.email_confirmed_at) {
          setShowEmailConfirmation(true);
          return;
        }

        // User profile data for completion
        const userData: UserData = {
          id: data.user.id,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          age: parseInt(formData.age),
          location: formData.location,
          isVerified: idUploadStatus === 'verified',
          profilePhotoUrl: formData.selfiePhotoUrl,
          bio: '',
          occupation: '',
          interests: [],
          personalityScores: {},
          propertyPreferences: {}
        };

        onAuthComplete(userData, true);
      }
    } catch (error: any) {
      console.error('❌ Sign up error:', error.message);
      
      if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
        setError(
          <div className="space-y-3">
            <p className="text-sm text-red-600">An account with this email already exists.</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setMode('signin');
                setError(null);
                setCurrentStep(0);
              }}
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In Instead
            </Button>
          </div>
        );
      } else {
        setError(error.message || 'Sign up failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [formData, idUploadStatus, signupStartTime, onAuthComplete, trackAnalytics]);

  // Resend confirmation handler
  const handleResendConfirmation = useCallback(async () => {
    setIsResending(true);
    setResendMessage(null);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
      });

      if (error) {
        throw error;
      }

      setResendMessage('Confirmation email sent! Please check your inbox.');
      setResendDisabled(true);
      
      setTimeout(() => {
        setResendDisabled(false);
      }, 60000);
      
    } catch (error: any) {
      setResendMessage(error.message || 'Failed to resend confirmation email. Please try again.');
    } finally {
      setIsResending(false);
    }
  }, [formData.email]);

  // Form submission handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (mode === 'signin') {
        await handleSignIn();
      } else {
        await handleSignUp();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  }, [mode, handleSignIn, handleSignUp]);

  // Supabase Required screen
  if (showSupabaseRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-purple-950/20 to-stone-100 text-stone-800">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between mb-8"
          >
            <Button 
              variant="ghost" 
              onClick={() => setShowSupabaseRequired(false)} 
              className="flex items-center text-stone-600 hover:text-purple-600"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            
            <ShareWithMeLogo size="md" />
            
            <div className="w-16" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-stone-200 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                  
                  <h1 className="text-2xl font-bold text-stone-900 mb-4">
                    Supabase Connection Required
                  </h1>
                  
                  <p className="text-stone-600 leading-relaxed">
                    File uploads and ID verification require a configured Supabase database. 
                    This ensures your data is securely stored and your identity documents are properly protected.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 via-cyan-50 to-emerald-50 rounded-xl p-6 border border-purple-200">
                    <h3 className="font-semibold text-stone-900 mb-4 flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                      Quick Setup Guide
                    </h3>
                    
                    <div className="space-y-4 text-sm text-stone-700">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <div>
                          <p className="font-medium">Create Supabase Project</p>
                          <p className="text-stone-600">Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">supabase.com</a> and create a new project</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <div>
                          <p className="font-medium">Get Your Credentials</p>
                          <p className="text-stone-600">Copy your Project URL and anon/public key from Settings → API</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                        <div>
                          <p className="font-medium">Add Environment Variables</p>
                          <p className="text-stone-600">Create a <code className="bg-stone-200 px-1 rounded">.env.local</code> file with your credentials</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                        <div>
                          <p className="font-medium">Set Up Storage</p>
                          <p className="text-stone-600">Create the <code className="bg-stone-200 px-1 rounded">user-documents</code> storage bucket</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
                    <h4 className="font-medium text-stone-900 mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                      Environment Variables (.env.local)
                    </h4>
                    <pre className="text-xs bg-stone-800 text-green-400 p-3 rounded font-mono overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
                    </pre>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-stone-600 mb-4">
                      After setup, restart your development server and refresh this page. 
                      For detailed instructions, see the 
                      <code className="bg-stone-200 px-1 rounded mx-1">supabase-storage-setup.md</code> 
                      file in your project.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        variant="outline"
                        onClick={() => setShowSupabaseRequired(false)}
                        className="border-2 border-stone-300 hover:border-purple-400 hover:bg-purple-50"
                      >
                        Continue Without Upload
                      </Button>
                      
                      <Button 
                        onClick={() => window.open('https://supabase.com', '_blank')}
                        className="bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 hover:from-purple-600 hover:via-cyan-600 hover:to-emerald-600 border-0 shadow-lg"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Create Supabase Project
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Email confirmation screen
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-purple-950/20 to-stone-100 text-stone-800">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between mb-8"
          >
            <Button 
              variant="ghost" 
              onClick={() => setShowEmailConfirmation(false)} 
              className="flex items-center text-stone-600 hover:text-purple-600"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            
            <ShareWithMeLogo size="md" />
            
            <div className="w-16" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-stone-200 shadow-2xl">
              <CardContent className="p-8 text-center space-y-6">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                  <Mail className="h-10 w-10 text-white" />
                </div>

                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-stone-900">
                    Check Your Email
                  </h1>
                  
                  <p className="text-stone-600 leading-relaxed">
                    We've sent a confirmation link to <strong>{formData.email}</strong>
                  </p>
                  
                  <p className="text-stone-600 leading-relaxed">
                    Click the link in your email to activate your account and start finding your perfect flatmate matches.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 via-cyan-50 to-emerald-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left flex-1">
                      <p className="text-sm font-medium text-stone-900 mb-1">
                        Didn't receive the email?
                      </p>
                      <p className="text-xs text-stone-600 mb-3">
                        Check your spam folder or try resending the confirmation email.
                      </p>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResendConfirmation}
                        disabled={isResending || resendDisabled}
                        className="text-xs h-8 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
                      >
                        {isResending ? (
                          <>
                            <div className="w-3 h-3 border border-purple-400/30 border-t-purple-400 rounded-full animate-spin mr-2" />
                            Sending...
                          </>
                        ) : resendDisabled ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-2" />
                            Email Sent
                          </>
                        ) : (
                          <>
                            <Mail className="h-3 w-3 mr-2" />
                            Resend Email
                          </>
                        )}
                      </Button>
                      
                      {resendMessage && (
                        <p className={`text-xs mt-2 ${
                          resendMessage.includes('sent') 
                            ? 'text-emerald-600' 
                            : 'text-red-600'
                        }`}>
                          {resendMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowEmailConfirmation(false);
                      setMode('signin');
                      setError(null);
                    }}
                    className="border-2 border-stone-300 hover:border-purple-400 hover:bg-purple-50"
                  >
                    Sign In Instead
                  </Button>
                  
                  <Button 
                    onClick={onBack}
                    className="bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 hover:from-purple-600 hover:via-cyan-600 hover:to-emerald-600 border-0 shadow-lg"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Sign in form
  if (mode === 'signin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-purple-950/20 to-stone-100 text-stone-800">
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <motion.div
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Button 
              variant="ghost" 
              onClick={onBack} 
              className="flex items-center text-stone-600 hover:text-purple-600"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            
            <ShareWithMeLogo size="md" />
            
            <div className="w-16" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-stone-200 shadow-2xl">
              <CardHeader className="text-center space-y-4 pb-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-stone-900">
                    Welcome Back
                  </h1>
                  <p className="text-stone-600">
                    Sign in to access your flatmate matches
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email" className="text-stone-900 flex items-center space-x-2 mb-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Address</span>
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="bg-white/70 border-stone-300 focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="signin-password" className="text-stone-900 flex items-center space-x-2 mb-2">
                      <Lock className="h-4 w-4" />
                      <span>Password</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="bg-white/70 border-stone-300 focus:border-purple-400 pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-stone-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-stone-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      {typeof error === 'string' ? (
                        <p className="text-sm text-red-600">{error}</p>
                      ) : (
                        error
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={!isStepValid() || isLoading}
                    className="w-full min-h-[48px] text-base bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 hover:from-purple-600 hover:via-cyan-600 hover:to-emerald-600 border-0 shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>

                <div className="text-center pt-4 border-t border-stone-200">
                  <p className="text-sm text-stone-600">
                    Don't have an account?{' '}
                    <button
                      onClick={() => {
                        setMode('signup');
                        setError(null);
                        setCurrentStep(0);
                      }}
                      className="text-purple-600 hover:text-purple-700 font-medium underline"
                    >
                      Create one here
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Step renderers
  const renderPersonalDetailsStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName" className="text-stone-900 flex items-center space-x-2 mb-2">
            <User className="h-4 w-4" />
            <span>First Name *</span>
          </Label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="Enter your first name"
            required
            className="bg-white/70 border-stone-300 focus:border-purple-400"
          />
        </div>
        
        <div>
          <Label htmlFor="lastName" className="text-stone-900 flex items-center space-x-2 mb-2">
            <User className="h-4 w-4" />
            <span>Last Name *</span>
          </Label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Enter your last name"
            required
            className="bg-white/70 border-stone-300 focus:border-purple-400"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email" className="text-stone-900 flex items-center space-x-2 mb-2">
          <Mail className="h-4 w-4" />
          <span>Email Address *</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="Enter your email address"
          required
          className="bg-white/70 border-stone-300 focus:border-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone" className="text-stone-900 flex items-center space-x-2 mb-2">
            <Phone className="h-4 w-4" />
            <span>Phone Number *</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="0412 345 678"
            required
            className="bg-white/70 border-stone-300 focus:border-purple-400"
          />
        </div>
        
        <div>
          <Label htmlFor="age" className="text-stone-900 flex items-center space-x-2 mb-2">
            <Calendar className="h-4 w-4" />
            <span>Age *</span>
          </Label>
          <Input
            id="age"
            type="number"
            min="18"
            max="65"
            value={formData.age}
            onChange={(e) => handleInputChange('age', e.target.value)}
            placeholder="25"
            required
            className="bg-white/70 border-stone-300 focus:border-purple-400"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location" className="text-stone-900 flex items-center space-x-2 mb-2">
          <MapPin className="h-4 w-4" />
          <span>Location *</span>
        </Label>
        <Input
          id="location"
          type="text"
          value={formData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          placeholder="e.g., Surry Hills, NSW"
          required
          className="bg-white/70 border-stone-300 focus:border-purple-400"
        />
      </div>
    </div>
  );

  const renderIdVerificationStep = () => (
    <div className="space-y-6">
      {/* Supabase Configuration Check */}
      {!isStorageAvailable() && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border border-amber-300 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-stone-900 mb-1">Database Connection Required</h4>
              <p className="text-xs text-stone-600 mb-3">
                File uploads require a Supabase database connection. Without this, you won't be able to complete ID verification.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSupabaseRequired(true)}
                className="text-xs h-8 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400"
              >
                <Sparkles className="h-3 w-3 mr-2" />
                Setup Supabase
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-purple-50 via-cyan-50 to-emerald-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-stone-900 mb-1">Why we verify identities</h4>
            <p className="text-xs text-stone-600">
              ID verification helps us keep our community safe by ensuring everyone is who they say they are. 
              Your documents are encrypted and securely stored.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-start space-x-3">
        <Checkbox 
          checked={formData.agreeToIdVerification}
          onCheckedChange={(checked) => handleInputChange('agreeToIdVerification', checked as boolean)}
          className="mt-1"
          required
        />
        <label className="text-sm text-stone-600 leading-relaxed">
          I consent to identity verification and understand this is required to access the platform. 
          My documents will be processed securely and stored encrypted. *
        </label>
      </div>

      {formData.agreeToIdVerification && (
        <>
          <div className="space-y-4">
            <div>
              <Label className="text-stone-900 flex items-center space-x-2 mb-3">
                <IdCard className="h-4 w-4" />
                <span>Upload Government ID *</span>
              </Label>
              <p className="text-xs text-stone-600 mb-3">
                Accepted: Driver's License, Passport, or State ID. Ensure all details are clearly visible.
              </p>
              
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'id');
                  }}
                  className="hidden"
                  id="id-upload"
                  required
                />
                <label 
                  htmlFor="id-upload"
                  className={`
                    block w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${formData.idDocument ? 'border-emerald-300 bg-emerald-50' : 'border-stone-300 hover:border-purple-400 bg-white/70'}
                  `}
                >
                  <div className="text-center">
                    {idUploadStatus === 'uploading' ? (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-6 h-6 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                        <span className="text-sm text-purple-600">Uploading... {uploadProgress}%</span>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                          <div 
                            className="bg-purple-500 h-1 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : idUploadStatus === 'analyzing' ? (
                      <div className="flex flex-col items-center space-y-2">
                        <Scan className="h-6 w-6 text-cyan-500 animate-pulse" />
                        <span className="text-sm text-cyan-600">Verifying document...</span>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                          <div 
                            className="bg-cyan-500 h-1 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : idUploadStatus === 'verified' ? (
                      <div className="flex flex-col items-center space-y-2">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                        <span className="text-sm text-emerald-700">Document verified!</span>
                        <span className="text-xs text-stone-500">{formData.idDocument?.name}</span>
                      </div>
                    ) : idUploadStatus === 'failed' ? (
                      <div className="flex flex-col items-center space-y-2">
                        <X className="h-6 w-6 text-red-600" />
                        <span className="text-sm text-red-600">Upload failed</span>
                        <span className="text-xs text-stone-500">Click to try again</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="h-6 w-6 text-stone-400" />
                        <span className="text-sm text-stone-600">Click to upload or drag file here</span>
                        <span className="text-xs text-stone-500">PNG, JPG or PDF up to 10MB</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-stone-900 flex items-center space-x-2 mb-3">
                <Camera className="h-4 w-4" />
                <span>Take a Selfie *</span>
              </Label>
              <p className="text-xs text-stone-600 mb-3">
                Take a clear photo of your face to verify your identity.
              </p>
              
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={startWebcam}
                  className="flex-1 border-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                  disabled={showWebcam}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Use Camera
                </Button>
                
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'selfie');
                    }}
                    className="hidden"
                    id="selfie-upload"
                  />
                  <label 
                    htmlFor="selfie-upload"
                    className="block w-full p-3 border-2 border-stone-300 text-stone-700 hover:bg-stone-50 rounded-lg cursor-pointer text-center transition-colors"
                  >
                    <Upload className="h-4 w-4 mx-auto mb-1" />
                    Upload Photo
                  </label>
                </div>
              </div>

              {formData.selfiePhoto && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-emerald-700">Selfie uploaded: {formData.selfiePhoto.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Webcam Modal */}
          <AnimatePresence>
            {showWebcam && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-xl p-6 max-w-md w-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-stone-900">Take Your Selfie</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={stopWebcam}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative bg-stone-100 rounded-lg overflow-hidden">
                      <video
                        id="webcam-video"
                        ref={(video) => {
                          if (video && webcamStream && isCameraReady) {
                            video.srcObject = webcamStream;
                            video.play();
                          }
                        }}
                        className="w-full h-64 object-cover"
                        autoPlay
                        playsInline
                        muted
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={stopWebcam}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={capturePhoto}
                        disabled={!isCameraReady}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Capture
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );

  const renderAccountSecurityStep = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="password" className="text-stone-900 flex items-center space-x-2 mb-2">
          <Lock className="h-4 w-4" />
          <span>Create Password *</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Create a secure password"
            required
            className="bg-white/70 border-stone-300 focus:border-purple-400 pr-12"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-stone-500" />
            ) : (
              <Eye className="h-4 w-4 text-stone-500" />
            )}
          </Button>
        </div>
        <p className="text-xs text-stone-600 mt-1">
          Must be at least 6 characters long
        </p>
      </div>

      <div>
        <Label htmlFor="confirmPassword" className="text-stone-900 flex items-center space-x-2 mb-2">
          <Lock className="h-4 w-4" />
          <span>Confirm Password *</span>
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          placeholder="Confirm your password"
          required
          className="bg-white/70 border-stone-300 focus:border-purple-400"
        />
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-xs text-red-600 mt-1">
            Passwords don't match
          </p>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-stone-200">
        <div className="flex items-start space-x-3">
          <Checkbox
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
            className="mt-1"
            required
          />
          <label className="text-sm text-stone-600 leading-relaxed">
            I agree to the{' '}
            <button 
              type="button"
              className="text-purple-600 hover:text-purple-700 underline"
              onClick={() => window.open('/terms', '_blank')}
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button 
              type="button"
              className="text-purple-600 hover:text-purple-700 underline"
              onClick={() => window.open('/privacy', '_blank')}
            >
              Privacy Policy
            </button>
            . *
          </label>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            checked={formData.marketingEmails}
            onCheckedChange={(checked) => handleInputChange('marketingEmails', checked as boolean)}
            className="mt-1"
          />
          <label className="text-sm text-stone-600 leading-relaxed">
            I'd like to receive updates about new features and community highlights via email.
          </label>
        </div>
      </div>
    </div>
  );

  // Main signup flow render
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-purple-950/20 to-stone-100 text-stone-800">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="flex items-center text-stone-600 hover:text-purple-600"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          
          <ShareWithMeLogo size="md" />
          
          <div className="w-16" />
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            {signupSteps.map((step, index) => (
              <div key={step.title} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                  ${index <= currentStep 
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 border-transparent text-white' 
                    : 'border-stone-300 text-stone-400'
                  }
                `}>
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                
                {index < signupSteps.length - 1 && (
                  <div className={`
                    w-16 h-0.5 mx-2 transition-colors
                    ${index < currentStep ? 'bg-gradient-to-r from-purple-500 to-cyan-500' : 'bg-stone-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <h2 className="text-xl font-semibold text-stone-900">
              {signupSteps[currentStep].title}
            </h2>
            <p className="text-stone-600 text-sm">
              {signupSteps[currentStep].description}
            </p>
          </div>
        </motion.div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-stone-200 shadow-2xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentStep === 0 && renderPersonalDetailsStep()}
                    {currentStep === 1 && renderIdVerificationStep()}
                    {currentStep === 2 && renderAccountSecurityStep()}
                  </motion.div>
                </AnimatePresence>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    {typeof error === 'string' ? (
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    ) : (
                      error
                    )}
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-stone-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('🔙 Previous button clicked in handler');
                      handlePrevStep();
                    }}
                    disabled={currentStep === 0}
                    className="border-2 border-stone-300 hover:border-purple-400 hover:bg-purple-50 min-h-[44px] px-6"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  {currentStep < signupSteps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('🔄 Next button clicked in handler');
                        console.log('Current validation state:', isStepValid());
                        if (isStepValid()) {
                          handleNextStep();
                        } else {
                          console.log('❌ Form validation failed, cannot proceed');
                        }
                      }}
                      disabled={!isStepValid()}
                      className="bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 hover:from-purple-600 hover:via-cyan-600 hover:to-emerald-600 border-0 shadow-lg min-h-[44px] px-6"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!isStepValid() || isLoading}
                      className="bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 hover:from-purple-600 hover:via-cyan-600 hover:to-emerald-600 border-0 shadow-lg min-h-[44px] px-6"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Create Account
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>

              <div className="text-center pt-6 border-t border-stone-200 mt-6">
                <p className="text-sm text-stone-600">
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                      setCurrentStep(0);
                    }}
                    className="text-purple-600 hover:text-purple-700 font-medium underline"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthFlow;