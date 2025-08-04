# Troubleshooting Guide - Share With Me

## 🚨 Critical Issue: Signup Authentication Failure

### Issue Summary
Users experience "Account creation failed" error during signup process at Step 3 (Account Security).

### Immediate Action Items

#### 1. Check Supabase Dashboard Settings
**Priority: HIGH**

```bash
# Navigate to your Supabase project dashboard
1. Go to Authentication > Settings
2. Verify these settings:
   - ✅ Enable email confirmations: OFF (for testing)
   - ✅ Enable phone confirmations: OFF
   - ✅ Enable custom SMTP: Optional
   - ✅ Site URL: http://localhost:3000 (development)
   - ✅ Redirect URLs: http://localhost:3000/** (wildcard)
```

**Check Auth Policies:**
```sql
-- Run in Supabase SQL Editor
-- Check if RLS is blocking user creation
SELECT * FROM auth.users LIMIT 5;

-- Check profiles table policies
SELECT * FROM profiles LIMIT 5;

-- Disable RLS temporarily for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

#### 2. Debug Network Requests
**Files to check**: `MobileOptimizedAuthFlow.tsx`, `AuthService.ts`

```javascript
// Add this to AuthService.signUp() method for debugging
console.log('🔍 Supabase Project URL:', process.env.SUPABASE_URL);
console.log('🔍 Supabase Anon Key:', process.env.SUPABASE_ANON_KEY?.substring(0, 20) + '...');

// Test basic Supabase connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Supabase connection test:', { data, error });
  } catch (err) {
    console.error('❌ Supabase connection failed:', err);
  }
};
```

#### 3. Browser Network Tab Investigation
1. Open Chrome DevTools → Network tab
2. Attempt signup
3. Look for failed requests to Supabase
4. Check response status codes and error messages

**Common Issues:**
- **Status 400**: Bad request - check request payload
- **Status 401**: Unauthorized - check API keys
- **Status 422**: Validation error - check required fields
- **Status 429**: Rate limited - wait and retry

#### 4. Minimal Test Implementation
Create a simple test to isolate the issue:

```typescript
// Add to MobileOptimizedAuthFlow.tsx for testing
const testMinimalSignup = async () => {
  try {
    console.log('🧪 Testing minimal signup...');
    
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpass123',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });
    
    console.log('🧪 Minimal signup result:', { data, error });
    
    if (error) {
      console.error('🧪 Minimal signup error:', error);
    } else {
      console.log('🧪 Minimal signup successful');
    }
  } catch (exception) {
    console.error('🧪 Minimal signup exception:', exception);
  }
};

// Call this function in a button click for testing
```

## 🔧 Step-by-Step Debugging Process

### Step 1: Environment Verification
```bash
# Check if environment variables are loaded
npm run dev

# In browser console, check:
console.log('ENV Check:', {
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
  urlFormat: process.env.SUPABASE_URL?.includes('supabase.co')
});
```

### Step 2: Supabase Client Test
```typescript
// Add to AuthService.ts or create test component
export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Basic connection
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    console.log('📋 Session test:', { session, sessionError });
    
    // Test 2: Simple signup
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPass123!',
    });
    
    console.log('📋 Signup test:', { signupData, signupError });
    
    return {
      connectionTest: !sessionError,
      signupTest: !signupError,
      errors: { sessionError, signupError }
    };
    
  } catch (error) {
    console.error('🚨 Supabase test failed:', error);
    return { connectionTest: false, signupTest: false, error };
  }
};
```

### Step 3: Form Data Validation
Check if form data is causing the issue:

```typescript
// Add to helpers.ts
export const debugFormData = (formData: FormData) => {
  console.group('📋 Form Data Debug');
  console.log('Email:', formData.email);
  console.log('Email valid:', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email));
  console.log('Password length:', formData.password.length);
  console.log('First name:', formData.firstName);
  console.log('Last name:', formData.lastName);
  console.log('Phone:', formData.phone);
  console.log('Age:', formData.age, typeof formData.age);
  console.log('Location:', formData.location);
  console.log('ID verified:', formData.idDocument !== null);
  console.groupEnd();
};
```

### Step 4: Network Error Analysis
```typescript
// Enhanced error logging in AuthService.ts
const logNetworkError = (error: any, context: string) => {
  console.group(`🌐 Network Error - ${context}`);
  console.log('Error message:', error.message);
  console.log('Error name:', error.name);
  console.log('Error code:', error.code);
  console.log('Network status:', navigator.onLine ? 'Online' : 'Offline');
  console.log('User agent:', navigator.userAgent);
  console.log('Timestamp:', new Date().toISOString());
  
  // Check for specific network issues
  if (error.message?.includes('fetch')) {
    console.log('🚨 Fetch API error detected');
  }
  if (error.message?.includes('CORS')) {
    console.log('🚨 CORS error detected');
  }
  if (error.code === 'NETWORK_ERROR') {
    console.log('🚨 Network connectivity issue');
  }
  
  console.groupEnd();
};
```

## 🐛 Common Issues & Solutions

### Issue 1: Email Confirmation Loop
**Symptoms**: User creates account but gets stuck in email confirmation
**Solution**:
```javascript
// Disable email confirmations in Supabase dashboard temporarily
// Or handle email confirmation properly:

// In Supabase Auth settings:
// 1. Go to Authentication > Settings
// 2. Turn OFF "Enable email confirmations"
// 3. Test signup flow
// 4. Re-enable after fixing
```

### Issue 2: RLS (Row Level Security) Blocking
**Symptoms**: User creation succeeds but profile creation fails
**Solution**:
```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Temporarily disable RLS for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Or create permissive policy
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT WITH CHECK (true);
```

### Issue 3: Environment Variables Not Loading
**Symptoms**: Undefined Supabase URL or keys
**Solution**:
```bash
# Check .env.local file exists and has correct format
cat .env.local

# Restart development server
npm run dev

# Verify in browser console
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
```

### Issue 4: CORS Configuration
**Symptoms**: Network errors or blocked requests
**Solution**:
```javascript
// In Supabase dashboard:
// 1. Go to Authentication > Settings
// 2. Add to "Site URL": http://localhost:3000
// 3. Add to "Redirect URLs": http://localhost:3000/**

// For production, add your domain
```

### Issue 5: Password Policy Violations
**Symptoms**: Weak password error
**Solution**:
```typescript
// Strengthen password validation
const validatePassword = (password: string): boolean => {
  return password.length >= 8 && 
         /[A-Z]/.test(password) && 
         /[0-9]/.test(password);
};
```

## 🔬 Advanced Debugging Tools

### 1. Supabase Connection Tester Component
```typescript
// Create components/SupabaseConnectionTest.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';

export const SupabaseConnectionTest = () => {
  const [results, setResults] = useState<any>(null);
  
  const runTests = async () => {
    const testResults = await testSupabaseConnection();
    setResults(testResults);
  };
  
  return (
    <div className="p-4 border rounded">
      <h3>Supabase Connection Test</h3>
      <Button onClick={runTests}>Run Tests</Button>
      {results && (
        <pre className="mt-4 p-2 bg-gray-100 rounded">
          {JSON.stringify(results, null, 2)}
        </pre>
      )}
    </div>
  );
};
```

### 2. Real-time Error Monitor
```typescript
// Add to App.tsx for development
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    window.addEventListener('error', (error) => {
      console.group('🚨 Global Error Caught');
      console.error('Error:', error.error);
      console.log('Filename:', error.filename);
      console.log('Line:', error.lineno);
      console.log('Column:', error.colno);
      console.groupEnd();
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.group('🚨 Unhandled Promise Rejection');
      console.error('Reason:', event.reason);
      console.groupEnd();
    });
  }
}, []);
```

## 📊 Debugging Checklist

### Pre-Testing Checklist
- [ ] Environment variables are set correctly
- [ ] Supabase project is active and accessible
- [ ] Database tables exist (profiles, etc.)
- [ ] Network connectivity is stable
- [ ] Browser cache is cleared

### During Testing Checklist
- [ ] Check browser console for errors
- [ ] Monitor network tab for failed requests
- [ ] Verify form data is valid
- [ ] Test with different email addresses
- [ ] Test with minimal required fields only

### Post-Error Checklist
- [ ] Copy exact error messages from console
- [ ] Note the step where failure occurs
- [ ] Check Supabase dashboard for any created users
- [ ] Verify database state
- [ ] Test the same flow in incognito mode

## 🚑 Emergency Fixes

### Quick Fix 1: Bypass Complex Validation
```typescript
// In AuthService.signUp(), temporarily simplify:
const { data, error } = await supabase.auth.signUp({
  email: userData.email,
  password: userData.password,
  // Remove complex metadata temporarily
});
```

### Quick Fix 2: Skip Profile Creation
```typescript
// In AuthService.signUp(), comment out profile creation:
// await supabaseData.users.create(profileData);
// Return user data without profile save
```

### Quick Fix 3: Enable Debug Mode
```typescript
// Add to AuthService.signUp()
const DEBUG_MODE = true;
if (DEBUG_MODE) {
  console.log('🐛 DEBUG MODE: Detailed logging enabled');
  // Add extensive logging here
}
```

## 📞 When to Escalate

Contact senior developer or Supabase support if:
- Issue persists after following all debugging steps
- Supabase dashboard shows unusual activity
- Multiple users report the same issue
- Network requests are being blocked by ISP/firewall
- Database corruption is suspected

## 📝 Logging Template

Use this template to document debugging sessions:

```
Date: [DATE]
Issue: Signup Authentication Failure
Browser: [Chrome/Firefox/Safari] [Version]
Device: [Desktop/Mobile] [OS]

Steps Taken:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Errors Found:
- [Error 1]: [Description]
- [Error 2]: [Description]

Console Logs:
[Paste relevant console output]

Network Requests:
[Paste failed request details]

Resolution Status: [Resolved/Ongoing/Escalated]
```

---

**Last Updated**: January 2025  
**Next Review**: After issue resolution