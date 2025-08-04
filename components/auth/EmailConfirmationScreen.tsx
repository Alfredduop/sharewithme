import React from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Mail, CheckCircle } from 'lucide-react';
import { AuthService } from '../../lib/authService';

interface EmailConfirmationScreenProps {
  email: string;
  onBack: () => void;
  onError: (error: string) => void;
}

export const EmailConfirmationScreen = ({ 
  email, 
  onBack, 
  onError 
}: EmailConfirmationScreenProps) => {
  const handleResendEmail = async () => {
    const { error } = await AuthService.resendConfirmation(email);
    if (error) {
      onError(error.message);
    } else {
      onError(''); // Clear error to show success
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-8 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-minimal-lg border-stone-200">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-stone-900">Check Your Email</h2>
            <p className="text-stone-600 mt-2">
              We've sent a confirmation link to <strong>{email}</strong>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Click the link in your email to activate your account, then you can sign in.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full mobile-touch-target"
                onClick={handleResendEmail}
              >
                Resend Email
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full mobile-touch-target"
                onClick={onBack}
              >
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};