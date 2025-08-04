import { FORM_VALIDATION, ERROR_MESSAGES } from './constants';

export interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  age: string;
  location: string;
  agreeToTerms: boolean;
  agreeToIdVerification: boolean;
  idDocument: File | null;
}

export const validateFormStep = (
  formData: FormData,
  currentStep: number,
  idVerified: boolean,
  mode: 'signin' | 'signup'
): boolean => {
  if (mode === 'signin') {
    return !!(formData.email && formData.password);
  }

  switch (currentStep) {
    case 0:
      return !!(formData.firstName && formData.lastName && formData.email && 
               formData.phone && formData.age && formData.location);
    case 1:
      return !!(formData.agreeToIdVerification && idVerified);
    case 2:
      return !!(formData.password && formData.confirmPassword && 
               formData.password === formData.confirmPassword && 
               formData.password.length >= FORM_VALIDATION.PASSWORD_MIN_LENGTH && 
               formData.agreeToTerms);
    default:
      return false;
  }
};

export const validateSignupData = (formData: FormData, idVerified: boolean): string | null => {
  // Check required fields
  if (!formData.firstName || !formData.lastName || !formData.email || 
      !formData.phone || !formData.age || !formData.location) {
    return ERROR_MESSAGES.REQUIRED_FIELDS;
  }

  // Check password
  if (!formData.password || formData.password.length < FORM_VALIDATION.PASSWORD_MIN_LENGTH) {
    return ERROR_MESSAGES.PASSWORD_TOO_SHORT;
  }

  // Check password confirmation
  if (formData.password !== formData.confirmPassword) {
    return ERROR_MESSAGES.PASSWORDS_DONT_MATCH;
  }

  // Check ID verification
  if (!idVerified) {
    return ERROR_MESSAGES.ID_VERIFICATION_REQUIRED;
  }

  return null;
};

export const enhanceErrorMessage = (error: any): string => {
  if (!error) return ERROR_MESSAGES.UNEXPECTED_ERROR;

  console.log('🔍 Debugging error details:', {
    code: error.code,
    message: error.message,
    name: error.name,
    status: error.status,
    details: error.details,
    fullError: error
  });

  // Handle specific Supabase error codes first
  if (error.code === 'user_already_exists' || error.message?.includes('User already registered')) {
    return ERROR_MESSAGES.USER_EXISTS;
  }
  
  if (error.code === 'invalid_credentials' || error.message?.includes('Invalid email')) {
    return ERROR_MESSAGES.INVALID_EMAIL;
  }
  
  if (error.code === 'weak_password' || error.message?.includes('Password should be at least')) {
    return ERROR_MESSAGES.WEAK_PASSWORD;
  }
  
  if (error.code === 'signup_disabled' || error.message?.includes('Signups not allowed')) {
    return 'Account registration is temporarily disabled. Please contact support.';
  }

  // Handle network and connection errors
  if (error.message?.includes('fetch') || 
      error.message?.includes('network') || 
      error.message?.includes('connection') || 
      error.name === 'TypeError' ||
      error.code === 'NETWORK_ERROR') {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  // Handle timeout errors
  if (error.message?.includes('timeout') || error.code === 'TIMEOUT') {
    return 'Request timed out. Please check your connection and try again.';
  }

  // Handle rate limiting
  if (error.status === 429 || error.message?.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Handle server errors
  if (error.status >= 500 || error.message?.includes('server error')) {
    return 'Server error occurred. Please try again in a few minutes.';
  }

  // Handle authentication service errors
  if (error.status === 400) {
    return 'Invalid request. Please check your information and try again.';
  }

  if (error.status === 401) {
    return 'Authentication failed. Please verify your information.';
  }

  if (error.status === 403) {
    return 'Access denied. Please contact support if this persists.';
  }

  // Handle custom error codes
  if (error.code === 'user_exists') {
    return ERROR_MESSAGES.USER_EXISTS;
  } else if (error.code === 'invalid_email') {
    return ERROR_MESSAGES.INVALID_EMAIL;
  } else if (error.code === 'invalid_phone') {
    return ERROR_MESSAGES.INVALID_PHONE;
  } else if (error.code === 'signup_failed') {
    return `Signup failed: ${error.message || 'Please verify your information and try again.'}`;
  }

  // Handle database errors
  if (error.message?.includes('duplicate key value')) {
    return ERROR_MESSAGES.USER_EXISTS;
  }

  // Handle specific error messages
  if (error.message?.includes('Service temporarily unavailable')) {
    return ERROR_MESSAGES.SIGNUP_SERVICE_UNAVAILABLE;
  }

  // If we have a specific error message, use it with context
  if (error.message && error.message !== 'signup_failed') {
    return `Account creation failed: ${error.message}`;
  }

  // Final fallback with debug info in development
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('dev');
  if (isDevelopment && error.message) {
    return `Development Debug - ${error.message} (Code: ${error.code || 'N/A'}, Status: ${error.status || 'N/A'})`;
  }

  return ERROR_MESSAGES.SIGNUP_SERVICE_UNAVAILABLE;
};

export const handleExceptionError = (error: any): string => {
  console.error('🚨 Exception error details:', {
    message: error.message,
    name: error.name,
    stack: error.stack,
    cause: error.cause,
    fullError: error
  });

  if (error instanceof Error) {
    if (error.message.includes('network') || 
        error.message.includes('fetch') || 
        error.name === 'TypeError' ||
        error.message.includes('Failed to fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    } else if (error.message.includes('timeout')) {
      return 'The request timed out. Please try again.';
    } else if (error.message.includes('duplicate')) {
      return ERROR_MESSAGES.USER_EXISTS;
    } else {
      // Provide more specific error information
      return `Account creation failed: ${error.message}`;
    }
  }

  return ERROR_MESSAGES.UNEXPECTED_ERROR;
};

export const prepareUserData = (formData: FormData) => ({
  email: formData.email.trim().toLowerCase(),
  password: formData.password,
  firstName: formData.firstName.trim(),
  lastName: formData.lastName.trim(),
  phone: formData.phone.trim(),
  age: parseInt(formData.age),
  location: formData.location.trim(),
  idDocumentUrl: formData.idDocument ? 'mock-id-document-url' : undefined,
});

export const logUserDataForDebug = (userData: ReturnType<typeof prepareUserData>) => {
  console.log('📝 Preparing user data for signup:', {
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    age: userData.age,
    location: userData.location,
    hasIdDocument: !!userData.idDocumentUrl
  });
};

// Additional debugging helper
export const debugAuthError = (error: any, context: string) => {
  console.group(`🐛 Auth Error Debug - ${context}`);
  console.log('Error object:', error);
  console.log('Error type:', typeof error);
  console.log('Error constructor:', error?.constructor?.name);
  console.log('Error code:', error?.code);
  console.log('Error message:', error?.message);
  console.log('Error status:', error?.status);
  console.log('Error details:', error?.details);
  console.log('Error hint:', error?.hint);
  console.log('Full error JSON:', JSON.stringify(error, null, 2));
  console.groupEnd();
};