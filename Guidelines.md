# Share With Me - Development Guidelines

## 🎯 Project Overview

Share With Me is a mobile-first sharehouse matching platform for Australian students and young professionals. These guidelines ensure consistency, performance, and maintainability across the entire codebase.

## 🎨 Design System Guidelines

### Color Palette
- **Primary Brand**: Purple/violet gradients (`#9333ea`, `#a855f7`)
- **Secondary**: Cyan accents (`#06b6d4`, `#0891b2`)
- **Tertiary**: Emerald highlights (`#10b981`, `#059669`)
- **Neutral**: Stone palette (`stone-50` to `stone-950`)
- **Background**: White (`#ffffff`) with stone-50 sections

### Typography
- **Font Family**: Inter with optimized font features (`'cv11', 'ss01'`)
- **Base Font Size**: 14px (responsive scaling)
- **Font Weights**: 300, 400, 500, 600, 700, 800, 900
- **Letter Spacing**: Tight spacing for headings (`-0.025em`)
- **Line Height**: Consistent 1.5 across all text elements

### Component Hierarchy
```
h1: text-2xl, font-medium, -tracking-tight
h2: text-xl, font-medium, -tracking-tight  
h3: text-lg, font-medium, -tracking-tight
h4: text-base, font-medium, -tracking-tight
p: text-base, font-normal, -tracking-tight
```

**Important**: Never override font sizes, weights, or line heights with Tailwind classes unless specifically requested. The base typography in `globals.css` handles this automatically.

## 📱 Mobile-First Development

### Touch Target Requirements
- **Minimum touch target**: 44px × 44px for all interactive elements
- **Use `.mobile-touch-target` class** for consistent touch targets
- **Button padding**: Use `.mobile-button-spacing` for responsive padding
- **Stack spacing**: Use `.mobile-stack` for consistent vertical spacing

### Responsive Breakpoints
```css
/* Mobile first approach */
default: 0px - 640px (mobile)
sm: 640px+ (large mobile)
md: 768px+ (tablet)
lg: 1024px+ (desktop)
xl: 1280px+ (large desktop)
```

### Mobile-Specific Requirements
- **Prevent zoom on inputs**: Use `font-size: 16px` minimum on form inputs
- **Touch-friendly navigation**: Sheet components for mobile menus
- **Optimize for low-end devices**: Use `will-change-transform` sparingly
- **iOS Safari fixes**: Apply `.ios-fix` class for viewport issues

## 🔧 Component Development Standards

### Component Structure
```typescript
// Standard component template
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';

interface ComponentProps {
  // Always include proper TypeScript interfaces
  onAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const Component = ({ onAction, className = "", children }: ComponentProps) => {
  // Component logic
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`base-classes ${className}`}
    >
      {children}
    </motion.div>
  );
};
```

### Required Imports
- **Motion**: Use `motion/react` (not framer-motion)
- **Icons**: Use `lucide-react` consistently
- **UI Components**: Import from `./ui/` directory
- **Services**: Import from `../lib/` directory

### Error Handling
- **Always wrap components** in error boundaries
- **Use SafeComponentLoader** for lazy-loaded components
- **Implement proper loading states** with skeleton loaders
- **Handle network failures gracefully** with retry mechanisms

## 🎭 Animation Guidelines

### Motion/React Usage
- **Use consistent easing**: `transition={{ duration: 0.3, ease: "easeOut" }}`
- **Stagger animations**: Use `delay` for sequential reveals
- **Performance**: Apply `will-change-transform` only during animations
- **Reduce motion**: Respect user preferences with `prefers-reduced-motion`

### Standard Animation Patterns
```typescript
// Page transitions
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}

// Button hover
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}

// Card entrance
initial={{ opacity: 0, y: 30 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
```

## 🎨 Styling Guidelines

### Tailwind v4 Usage
- **Use CSS variables**: Defined in `globals.css` with proper theming
- **Custom utilities**: Available for mobile optimizations
- **Color system**: Use semantic color names (`primary`, `secondary`, `muted`)
- **Spacing**: Use consistent spacing scale (4, 8, 12, 16, 24, 32, 48, 64)

### Shadow and Border Guidelines
- **Minimal shadows**: Use `.shadow-minimal` and `.shadow-minimal-lg`
- **Border radius**: Use `rounded-lg` (12px) for cards, `rounded-xl` (16px) for modals
- **Border colors**: Use `border-stone-200` for light borders

### Button Variants
- **Primary**: `bg-purple-600 hover:bg-purple-700 text-white`
- **Secondary**: `border border-stone-300 bg-white hover:bg-stone-50`
- **Ghost**: `hover:bg-stone-100 text-stone-700`
- **Destructive**: `bg-red-600 hover:bg-red-700 text-white`

## 🏗 Architecture Guidelines

### File Organization
```
components/
├── ui/              # Shadcn/ui components (don't modify)
├── auth/            # Authentication-specific components
├── landing/         # Landing page sections
├── blog/            # Blog post components
└── [feature]/       # Feature-specific components

lib/
├── hooks/           # Custom React hooks
├── services/        # External service integrations
└── utils/           # Utility functions
```

### Import Organization
```typescript
// 1. React and external libraries
import React, { useState } from 'react';
import { motion } from 'motion/react';

// 2. UI components
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

// 3. Custom components
import { ShareWithMeLogo } from './ShareWithMeLogo';

// 4. Hooks and utilities
import { useAuth } from '../lib/hooks/useAuth';

// 5. Types and constants
import { ViewType } from '../lib/types';
import { ERROR_MESSAGES } from './auth/constants';

// 6. Icons (last)
import { Mail, User, ArrowRight } from 'lucide-react';
```

### State Management
- **Use built-in React state** for component-level state
- **Custom hooks** for shared logic (`useAuth`, `useNavigation`)
- **Supabase realtime** for data synchronization
- **Avoid global state libraries** unless absolutely necessary

## 🔐 Authentication Guidelines

### Current Authentication Flow
- **Status**: 🔴 CRITICAL ISSUE - Signup fails at Step 3
- **Components**: `MobileOptimizedAuthFlow.tsx`, `AuthService.ts`
- **Error Handling**: Comprehensive logging implemented
- **Testing**: Debug functions available (`testSupabaseConnection`)

### Authentication Standards
- **Always validate client-side** before server requests
- **Use proper error messages** with `enhanceErrorMessage()`
- **Implement retry logic** for network failures
- **Log all auth events** for debugging purposes

### Security Requirements
- **Never expose service role key** in frontend
- **Validate all form inputs** before submission
- **Use HTTPS only** for all authentication requests
- **Implement proper session management** with Supabase

## 📊 Performance Guidelines

### Loading Optimization
- **Use skeleton loaders** instead of spinners when possible
- **Implement progressive loading** for large components
- **Lazy load non-critical components** with `SafeComponentLoader`
- **Optimize images** with proper sizing and formats

### Code Splitting
```typescript
// Use dynamic imports for large components
const PersonalityQuiz = React.lazy(() => import('./PersonalityQuiz'));
const CommunityMarketplace = React.lazy(() => import('./CommunityMarketplace'));
```

### Bundle Size Management
- **Avoid large dependencies** without tree shaking
- **Use specific imports**: `import { Button } from './ui/button'`
- **Monitor bundle size** with `npm run analyze`
- **Remove unused dependencies** regularly

## 🌐 SEO and Accessibility

### SEO Requirements
- **Dynamic meta tags** using `updateSEO()` function
- **Semantic HTML** structure throughout
- **Australian English** spelling and terminology
- **Local SEO** optimization for Australian cities

### Accessibility Standards
- **WCAG 2.1 AA compliance** for all components
- **Keyboard navigation** support for all interactive elements
- **Screen reader compatibility** with proper ARIA labels
- **Color contrast** minimum 4.5:1 for normal text

### Australian Localization
- **Phone number validation**: Australian format (`+61` or `04xx xxx xxx`)
- **Date formats**: DD/MM/YYYY or "10 Jan 2024"
- **Currency**: AUD ($) when relevant
- **Spelling**: Australian English (colour, centre, realise)

## 🧪 Testing Guidelines

### Manual Testing Checklist
- [ ] Test on actual mobile devices (not just browser dev tools)
- [ ] Verify touch targets are 44px minimum
- [ ] Check offline/poor connection scenarios
- [ ] Test with screen readers
- [ ] Verify form validation works correctly
- [ ] Test authentication flow end-to-end

### Browser Support
- **Primary**: Chrome, Safari, Firefox (latest 2 versions)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Testing**: Use real devices when possible

## 🚨 Critical Issue Guidelines

### Authentication Signup Issue
**Current blocker requires immediate attention:**

1. **Verify Supabase settings** in dashboard
2. **Check database RLS policies** for profiles table
3. **Test with minimal signup data** using `testMinimalSignup()`
4. **Monitor network requests** in browser dev tools
5. **Review console logs** for specific error details

### Debugging Process
1. **Use enhanced logging** already implemented
2. **Check connection status** with `testSupabaseConnection()`
3. **Validate form data** with client-side checks
4. **Test network failure scenarios** with retry logic
5. **Escalate to Supabase support** if infrastructure issue

## 🔄 Development Workflow

### Git Workflow
```bash
# Feature development
git checkout -b feature/signup-fix
git commit -m "fix: resolve authentication signup failure"
git push origin feature/signup-fix

# Commit message format
type(scope): description
# Types: feat, fix, docs, style, refactor, test, chore
```

### Code Review Requirements
- [ ] Mobile responsiveness verified
- [ ] Accessibility standards met
- [ ] TypeScript types properly defined
- [ ] Error handling implemented
- [ ] Performance impact considered
- [ ] Documentation updated if needed

### Deployment Checklist
- [ ] All environment variables configured
- [ ] Supabase migrations applied
- [ ] Email services configured
- [ ] Mobile testing completed
- [ ] Error monitoring enabled
- [ ] Performance metrics baseline established

## 📝 Documentation Standards

### Component Documentation
```typescript
/**
 * MobileOptimizedAuthFlow - Handles user authentication with mobile-first design
 * 
 * @param onBack - Function to navigate back to previous screen
 * @param onAuthComplete - Function called when authentication succeeds
 * @param mode - Authentication mode ('signin' | 'signup')
 * 
 * @example
 * <MobileOptimizedAuthFlow
 *   onBack={() => setView('landing')}
 *   onAuthComplete={(user) => handleUserAuth(user)}
 *   mode="signup"
 * />
 */
```

### README Updates
- **Keep installation steps current** with actual dependencies
- **Update known issues** as they are resolved
- **Document new features** with usage examples
- **Maintain troubleshooting guide** with latest solutions

## 🎯 Success Metrics

### User Experience Goals
- **Page load time**: < 2 seconds on 3G
- **Touch response**: < 100ms for all interactions
- **Conversion rate**: > 15% signup completion
- **Mobile bounce rate**: < 40%

### Technical Goals
- **Bundle size**: < 500KB gzipped
- **Lighthouse score**: > 90 for all metrics
- **Error rate**: < 1% for all user actions
- **Uptime**: > 99.9% availability

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Next Review**: After authentication issue resolution

> 🚨 **Priority**: Resolve authentication signup failure before adding new features