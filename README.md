# Share With Me - Sharehouse Matching Platform

A modern React-based platform for matching flatmates in Australia using AI-powered personality and lifestyle questionnaires.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd share-with-me

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your actual values

# Start development server
npm run dev
```

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Known Issues](#known-issues)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🎯 Project Overview

Share With Me is a comprehensive sharehouse matching platform that includes:

- **AI-Powered Matching**: Personality and lifestyle questionnaires to match compatible flatmates
- **Property Listings**: Age range fields for property listers with prominent "List Your Property" buttons
- **Community Marketplace**: Verified users can trade items through in-app chat
- **Email Subscriptions**: Backend integration with Supabase for newsletter signups
- **Mobile-Optimized**: Fully responsive design with touch-friendly interfaces
- **Authentication System**: Comprehensive ID verification during onboarding

### Key Features

- ✅ Personality quiz with AI matching algorithm
- ✅ Property listing with age preferences
- ✅ Community marketplace with chat functionality
- ✅ Email subscription system with analytics
- ✅ Mobile-optimized authentication flow
- ✅ Profile photo upload functionality
- ✅ Support chat with EmailJS integration
- ⚠️  **ISSUE**: Signup authentication flow (see [Known Issues](#known-issues))

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS v4** with Inter font
- **Motion/React** (formerly Framer Motion) for animations
- **Lucide React** for icons
- **Shadcn/ui** component library

### Backend & Services
- **Supabase** for database, authentication, and storage
- **Deno** for edge functions
- **Hono** web framework for API routes
- **EmailJS** for support chat integration

### Development Tools
- **Vite** for bundling
- **ESLint** and **Prettier** for code quality
- **Figma Make** for component generation

## 📁 Project Structure

```
├── components/                 # React components
│   ├── auth/                  # Authentication components
│   │   ├── MobileOptimizedAuthFlow.tsx  # Main auth component
│   │   ├── EmailConfirmationScreen.tsx
│   │   ├── SignupSteps.tsx
│   │   ├── constants.ts
│   │   └── helpers.ts         # Auth helper functions
│   ├── landing/               # Landing page sections
│   ├── ui/                    # Shadcn/ui components
│   └── blog/                  # Blog post components
├── lib/                       # Utility libraries
│   ├── authService.ts         # Authentication service
│   ├── emailSubscription.ts   # Email subscription service
│   ├── supabase.ts           # Supabase client
│   ├── hooks/                # Custom React hooks
│   └── types.ts              # TypeScript definitions
├── supabase/                  # Supabase configuration
│   ├── functions/server/      # Edge functions
│   └── migrations/           # Database migrations
├── styles/                    # Global styles
│   └── globals.css           # Tailwind v4 configuration
└── utils/                     # Utility functions
```

## 🔧 Environment Setup

### Required Environment Variables

Create `.env.local` with the following variables:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_URL=your_database_url

# EmailJS Configuration (for support chat)
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key

# Optional: Analytics
GA_MEASUREMENT_ID=your_google_analytics_id
```

### Supabase Setup

1. Create a new Supabase project
2. Run the migrations in `/database/migrations/`
3. Configure authentication settings
4. Set up storage buckets (if using file uploads)

See `supabase-storage-setup.md` for detailed instructions.

### EmailJS Setup

1. Create an EmailJS account
2. Set up a service (Gmail/Outlook/etc.)
3. Create an email template
4. Get your service ID, template ID, and public key

See `email-setup-instructions.md` for detailed instructions.

## ⚠️ Known Issues

### Critical: Signup Authentication Failure

**Status**: 🔴 UNRESOLVED  
**Priority**: HIGH  
**Component**: `MobileOptimizedAuthFlow.tsx` + `AuthService.ts`

#### Issue Description
Users experience "Account creation failed" error during the signup process, specifically at Step 3 (Account Security) when creating their password.

#### Symptoms
- Generic "signup failed" error message appears
- Console shows detailed error logging but signup still fails
- Issue persists despite comprehensive error handling implementation

#### Files Involved
- `/components/MobileOptimizedAuthFlow.tsx` - Main auth flow component
- `/lib/authService.ts` - Authentication service with Supabase integration
- `/components/auth/helpers.ts` - Error handling and validation
- `/components/auth/SignupSteps.tsx` - Individual signup steps

#### Recent Changes Made
- ✅ Enhanced error handling with specific error messages
- ✅ Added connection status monitoring
- ✅ Implemented retry functionality for network errors
- ✅ Added comprehensive console logging for debugging
- ✅ Improved client-side validation
- ✅ Added pre-flight connectivity checks

#### Next Steps for Developer
1. **Check Supabase Configuration**:
   - Verify auth settings in Supabase dashboard
   - Check if email confirmation is required
   - Verify RLS policies are not blocking user creation

2. **Debug Network Requests**:
   - Use browser dev tools to inspect actual Supabase API calls
   - Check for CORS issues
   - Verify authentication headers

3. **Test Authentication Flow**:
   - Test with different email providers
   - Try disabling email confirmation temporarily
   - Test with minimal user data

4. **Check Console Logs**:
   - Enhanced logging is implemented - check browser console
   - Look for specific error codes and messages
   - Check network tab for failed requests

#### Debugging Tools Available
- Enhanced error logging in `debugAuthError()` function
- Connection status monitoring
- Retry mechanisms for network failures
- Supabase connection testing

See `TROUBLESHOOTING.md` for detailed debugging steps.

## 💻 Development Workflow

### Getting Started
1. Install dependencies: `npm install`
2. Set up environment variables
3. Start development server: `npm run dev`
4. Visit `http://localhost:3000`

### Code Organization
- **Components**: Modular React components with TypeScript
- **Hooks**: Custom hooks in `/lib/hooks/`
- **Services**: API and external service integrations in `/lib/`
- **Styles**: Tailwind v4 with custom CSS variables
- **Types**: Centralized TypeScript definitions

### Design System
- **Colors**: Purple/violet/cyan gradients with light stone themes
- **Typography**: Inter font with optimized font features
- **Mobile-First**: Touch-friendly interfaces with 44px minimum touch targets
- **Animations**: Motion/React for smooth interactions

### Component Guidelines
- Use functional components with hooks
- Implement proper error boundaries
- Follow mobile-first responsive design
- Use TypeScript for all components
- Include proper accessibility attributes

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
- Set all variables from `.env.example`
- Use production Supabase project URLs
- Configure proper CORS settings

### Pre-Deployment Checklist
- [ ] All environment variables configured
- [ ] Supabase project set up and configured
- [ ] EmailJS service configured
- [ ] Authentication flow tested
- [ ] Mobile responsiveness verified
- [ ] Error handling tested

## 🔍 Troubleshooting

### Common Issues

#### "Account creation failed" Error
See [Known Issues](#known-issues) section above.

#### Supabase Connection Issues
1. Verify environment variables are correct
2. Check Supabase project status
3. Verify CORS settings
4. Test connection with `SupabaseConnectionTest` component

#### Email Subscription Not Working
1. Check backend server routes in `/supabase/functions/server/`
2. Verify Supabase edge functions are deployed
3. Test email subscription endpoints manually

#### Mobile Touch Issues
1. Verify `mobile-touch-target` class is applied
2. Check minimum 44px touch target sizes
3. Test on actual devices, not just browser dev tools

### Debugging Components
- `SupabaseConnectionTest.tsx` - Test Supabase connectivity
- `SubscriptionAnalytics.tsx` - View email subscription analytics
- `SimpleAnalyticsDashboard.tsx` - View app usage analytics

### Development Tools
- Browser dev tools for network inspection
- React dev tools for component debugging
- Supabase dashboard for database inspection
- Console logging throughout authentication flow

## 📞 Support

### For Developers
- Check `TROUBLESHOOTING.md` for specific issue resolution
- Review component documentation in individual files
- Use debugging components for testing connectivity

### For Users
- Support chat is integrated with EmailJS
- Emails are sent to `hello@sharewithme.io`
- Mobile-optimized support interface available

## 📝 Additional Documentation

- `TROUBLESHOOTING.md` - Detailed troubleshooting guide
- `deployment-guide.md` - Deployment instructions
- `email-setup-instructions.md` - EmailJS configuration
- `supabase-storage-setup.md` - Supabase setup guide
- `Guidelines.md` - Development guidelines

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Development (Authentication issue pending resolution)