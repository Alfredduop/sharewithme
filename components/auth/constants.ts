import { User, Shield, Lock } from "lucide-react";

export const SIGNUP_STEPS = [
  { title: "Personal Details", icon: User },
  { title: "Identity Verification", icon: Shield },
  { title: "Account Security", icon: Lock }
];

export const FORM_VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  AGE_MIN: 16,
  AGE_MAX: 100,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^(\+61|0)[2-9]\d{8}$/,
};

export const ERROR_MESSAGES = {
  REQUIRED_FIELDS: 'Please fill in all required fields.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
  ID_VERIFICATION_REQUIRED: 'Please upload and verify your ID document first.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid Australian phone number.',
  INVALID_AGE: 'Age must be between 16 and 100.',
  WEAK_PASSWORD: 'Please choose a stronger password (at least 8 characters).',
  USER_EXISTS: 'An account with this email already exists. Please try signing in instead.',
  NETWORK_ERROR: 'Network error. Please check your internet connection and try again.',
  SIGNUP_SERVICE_UNAVAILABLE: 'Our signup service is temporarily experiencing issues. Please try again in a few minutes or contact support if the problem persists.',
  UNEXPECTED_ERROR: 'An unexpected error occurred during account creation.',
};

export const SUCCESS_MESSAGES = {
  ID_UPLOADED: 'ID Verified!',
  SIGNUP_COMPLETED: 'Account created successfully!',
};

export const UPLOAD_CONFIG = {
  ACCEPTED_TYPES: 'image/*,.pdf',
  MAX_PROGRESS: 100,
  PROGRESS_CLEAR_DELAY: 1000,
};