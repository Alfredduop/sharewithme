import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { Shield, Upload, CheckCircle } from 'lucide-react';
import { FormData } from './helpers';
import { UPLOAD_CONFIG } from './constants';

interface StepProps {
  formData: FormData;
  onInputChange: (field: keyof FormData, value: any) => void;
}

export const PersonalDetailsStep = ({ formData, onInputChange }: StepProps) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          placeholder="John"
          value={formData.firstName}
          onChange={(e) => onInputChange('firstName', e.target.value)}
          className="mobile-touch-target"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          placeholder="Smith"
          value={formData.lastName}
          onChange={(e) => onInputChange('lastName', e.target.value)}
          className="mobile-touch-target"
          required
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        placeholder="your@email.com"
        value={formData.email}
        onChange={(e) => onInputChange('email', e.target.value)}
        className="mobile-touch-target"
        autoComplete="email"
        required
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="phone">Phone</Label>
      <Input
        id="phone"
        type="tel"
        placeholder="0412 345 678"
        value={formData.phone}
        onChange={(e) => onInputChange('phone', e.target.value)}
        className="mobile-touch-target"
        required
      />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          type="number"
          placeholder="25"
          min="16"
          max="100"
          value={formData.age}
          onChange={(e) => onInputChange('age', e.target.value)}
          className="mobile-touch-target"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">City</Label>
        <Input
          id="location"
          placeholder="Sydney"
          value={formData.location}
          onChange={(e) => onInputChange('location', e.target.value)}
          className="mobile-touch-target"
          required
        />
      </div>
    </div>
  </div>
);

interface IdentityVerificationStepProps extends StepProps {
  idVerified: boolean;
  uploadProgress: number;
  onFileUpload: (file: File) => void;
}

export const IdentityVerificationStep = ({ 
  formData, 
  onInputChange, 
  idVerified, 
  uploadProgress, 
  onFileUpload 
}: IdentityVerificationStepProps) => (
  <div className="space-y-6">
    <div className="text-center">
      <Shield className="h-12 w-12 mx-auto mb-4 text-purple-600" />
      <p className="text-stone-600">
        Help keep our community safe by verifying your identity with a photo ID
      </p>
    </div>

    <div className="flex items-center space-x-2">
      <Checkbox
        id="agreeToIdVerification"
        checked={formData.agreeToIdVerification}
        onCheckedChange={(checked) => 
          onInputChange('agreeToIdVerification', checked)
        }
      />
      <Label htmlFor="agreeToIdVerification" className="text-sm">
        I agree to provide ID verification for account security
      </Label>
    </div>

    {formData.agreeToIdVerification && (
      <div className="space-y-4">
        <div className="space-y-3">
          <Label>Upload Photo ID</Label>
          <div className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center hover:border-purple-300 transition-colors">
            <input
              type="file"
              accept={UPLOAD_CONFIG.ACCEPTED_TYPES}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onFileUpload(file);
                }
              }}
              className="hidden"
              id="id-upload"
            />
            <Label htmlFor="id-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                {idVerified ? (
                  <CheckCircle className="h-8 w-8 text-emerald-600 mb-2" />
                ) : (
                  <Upload className="h-8 w-8 text-stone-400 mb-2" />
                )}
                <span className="text-sm font-medium">
                  {idVerified ? 'ID Verified!' : 'Tap to upload ID'}
                </span>
                <span className="text-xs text-stone-500 mt-1">
                  Driver's licence, passport, or government ID
                </span>
              </div>
            </Label>
          </div>
        </div>

        {uploadProgress > 0 && uploadProgress < UPLOAD_CONFIG.MAX_PROGRESS && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading ID document...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
      </div>
    )}
  </div>
);

interface AccountSecurityStepProps extends StepProps {
  showPassword: boolean;
  onTogglePassword: () => void;
}

export const AccountSecurityStep = ({ 
  formData, 
  onInputChange, 
  showPassword, 
  onTogglePassword 
}: AccountSecurityStepProps) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="password">Create Password</Label>
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="At least 8 characters"
          value={formData.password}
          onChange={(e) => onInputChange('password', e.target.value)}
          className="mobile-touch-target pr-12"
          minLength={8}
          required
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-stone-100 rounded-md flex items-center justify-center"
          onClick={onTogglePassword}
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="confirmPassword">Confirm Password</Label>
      <Input
        id="confirmPassword"
        type="password"
        placeholder="Confirm your password"
        value={formData.confirmPassword}
        onChange={(e) => onInputChange('confirmPassword', e.target.value)}
        className="mobile-touch-target"
        required
      />
      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
        <p className="text-sm text-red-600">Passwords don't match</p>
      )}
    </div>

    <div className="flex items-center space-x-2">
      <Checkbox
        id="agreeToTerms"
        checked={formData.agreeToTerms}
        onCheckedChange={(checked) => onInputChange('agreeToTerms', checked)}
      />
      <Label htmlFor="agreeToTerms" className="text-sm">
        I agree to the Terms of Service and Privacy Policy
      </Label>
    </div>
  </div>
);