import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { Mail, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { EmailSubscriptionService, SubscriptionSource } from '../lib/emailSubscription';

interface EmailSubscriptionProps {
  variant?: 'default' | 'compact' | 'inline';
  title?: string;
  description?: string;
  className?: string;
  source?: SubscriptionSource;
}

export const EmailSubscription = ({ 
  variant = 'default',
  title = "Stay Updated",
  description = "Be the first to know when we launch and get exclusive updates.",
  className = "",
  source = 'unknown'
}: EmailSubscriptionProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    if (!EmailSubscriptionService.isValidEmail(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');
    setMessage('');

    try {
      console.log(`📧 Attempting subscription from source: ${source}`);
      const result = await EmailSubscriptionService.subscribe(email, source);

      if (result.success) {
        setStatus('success');
        setMessage(result.message);
        if (!result.alreadySubscribed) {
          setEmail(''); // Clear email only if it's a new subscription
        }
        console.log(`✅ Subscription successful from ${source}:`, email);
      } else {
        setStatus('error');
        setMessage(result.message);
        console.error(`❌ Subscription failed from ${source}:`, result.error);
      }

    } catch (error) {
      console.error('Email subscription error:', error);
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCompactVariant = () => (
    <div className={`space-y-3 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-white/80 text-sm">{description}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="bg-white text-purple-600 hover:bg-white/90 mobile-touch-target"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
          </Button>
        </div>

        {status !== 'idle' && (
          <Alert variant={status === 'success' ? 'default' : 'destructive'} className="bg-white/10 border-white/20">
            {status === 'success' ? (
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-400" />
            )}
            <AlertDescription className={status === 'success' ? 'text-emerald-100' : 'text-red-100'}>
              {message}
            </AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );

  const renderInlineVariant = () => (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 mobile-touch-target"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="bg-purple-600 hover:bg-purple-700 mobile-touch-target whitespace-nowrap"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Subscribing...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Subscribe
              </>
            )}
          </Button>
        </div>

        {status !== 'idle' && (
          <Alert variant={status === 'success' ? 'default' : 'destructive'}>
            {status === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );

  const renderDefaultVariant = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={`text-center space-y-6 ${className}`}
    >
      <div className="space-y-3">
        <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
          <Mail className="h-8 w-8 text-purple-600" />
        </div>
        <h3 className="text-2xl font-semibold text-stone-900">{title}</h3>
        <p className="text-stone-600 max-w-md mx-auto">{description}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 mobile-touch-target"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="bg-purple-600 hover:bg-purple-700 mobile-touch-target whitespace-nowrap"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Subscribing...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Subscribe
              </>
            )}
          </Button>
        </div>

        {status !== 'idle' && (
          <Alert variant={status === 'success' ? 'default' : 'destructive'}>
            {status === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </form>
    </motion.div>
  );

  // Render based on variant
  switch (variant) {
    case 'compact':
      return renderCompactVariant();
    case 'inline':
      return renderInlineVariant();
    default:
      return renderDefaultVariant();
  }
};

export default EmailSubscription;