# Share With Me - Production Deployment Guide

## 🚀 Supabase Production Setup

### Step 1: Create Production Supabase Project

1. **Go to Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Create a new project for production
   - Choose a region close to Australia (e.g., Sydney/Singapore)

2. **Get Your Production Credentials**
   ```bash
   # Your production Supabase URL will look like:
   https://your-prod-project-ref.supabase.co
   
   # Your production anon key will be in:
   Project Settings > API > Project API keys > anon/public
   ```

### Step 2: Set Up Production Database

1. **Run the Database Schema**
   - Go to Supabase Dashboard > SQL Editor
   - Copy and paste the entire contents of `/database/schema.sql`
   - Execute the script to create all tables, functions, and policies

2. **Configure Authentication**
   - Go to Authentication > Settings
   - Add your production domain: `https://sharewithme.io`
   - Configure email templates and SMTP (recommended)
   - Set up OAuth providers if needed

3. **Configure Storage (Optional)**
   ```sql
   -- If you plan to add image uploads later
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('user-avatars', 'user-avatars', true);
   
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('property-images', 'property-images', true);
   
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('marketplace-images', 'marketplace-images', true);
   ```

### Step 3: Environment Variables for Deployment

**⚠️ Important:** This is a Vite application, so environment variables must be prefixed with `VITE_` to be accessible in the browser. Do not use `NEXT_PUBLIC_` prefix.

#### For Vercel:
```bash
# In your Vercel dashboard, add these environment variables:
VITE_SUPABASE_URL=https://your-prod-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
NODE_ENV=production
VITE_APP_URL=https://sharewithme.io
```

#### For Netlify:
```bash
# In your Netlify dashboard, add these build environment variables:
VITE_SUPABASE_URL=https://your-prod-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
NODE_ENV=production
VITE_APP_URL=https://sharewithme.io
```

#### For Railway/Render:
```bash
# Add these environment variables in your service settings:
VITE_SUPABASE_URL=https://your-prod-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
NODE_ENV=production
VITE_APP_URL=https://sharewithme.io
```

**Important:** These are Vite environment variables (prefixed with `VITE_`), not Next.js variables (`NEXT_PUBLIC_`). Make sure to use the correct prefix for your Vite/React application.

### Step 4: Build Configuration

1. **Update your build command:**
   ```bash
   npm run build
   ```

2. **Ensure your build settings:**
   ```json
   // package.json
   {
     "scripts": {
       "build": "vite build",
       "preview": "vite preview"
     }
   }
   ```

3. **Environment Variable Troubleshooting:**
   If you encounter `TypeError: Cannot read properties of undefined`, ensure:
   - Environment variables are prefixed with `VITE_`
   - Variables are set in your hosting platform's environment settings
   - Your build process has access to the environment variables

### Step 5: Domain Configuration

#### DNS Settings for OnlyDomains:
```
# Add these DNS records in your OnlyDomains dashboard:

# For Vercel:
Type: CNAME
Name: @
Value: cname.vercel-dns.com

# For Netlify:
Type: CNAME  
Name: @
Value: your-site-name.netlify.app

# For custom hosting:
Type: A
Name: @
Value: [Your hosting provider's IP]
```

### Step 6: Security Configuration

1. **Row Level Security Policies**
   - Your database schema already includes RLS policies
   - Review and test all policies in production

2. **CORS Configuration**
   - Supabase will automatically configure CORS for your domain
   - Ensure `https://sharewithme.io` is in your allowed origins

3. **Rate Limiting**
   ```sql
   -- Add rate limiting for sensitive operations
   SELECT cron.schedule('cleanup-expired-matches', '0 2 * * *', 
     'UPDATE matches SET status = ''expired'' WHERE created_at < NOW() - INTERVAL ''30 days'' AND status = ''pending'';'
   );
   ```

### Step 7: Production Monitoring

1. **Enable Database Logs**
   - Go to Supabase Dashboard > Logs
   - Monitor API usage and database performance

2. **Set Up Alerts**
   ```sql
   -- Monitor user signups
   SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '1 day';
   
   -- Monitor active listings
   SELECT COUNT(*) FROM properties WHERE is_active = true;
   
   -- Monitor marketplace activity
   SELECT COUNT(*) FROM marketplace_items WHERE created_at >= NOW() - INTERVAL '1 day';
   ```

### Step 8: Backup Strategy

1. **Daily Backups**
   - Supabase Pro plan includes daily backups
   - Consider upgrading for production use

2. **Data Export Scripts**
   ```bash
   # Regular data exports for critical tables
   pg_dump --host=db.your-project-ref.supabase.co \
           --username=postgres \
           --no-password \
           --table=public.users \
           --table=public.properties \
           --table=public.marketplace_items \
           your-database-name > backup.sql
   ```

## 🔧 Deployment Platforms

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Add environment variables in Vercel dashboard
# Connect your domain in Project Settings > Domains
```

### Option 2: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist

# Add environment variables in Site Settings > Environment Variables
# Connect your domain in Site Settings > Domain Management
```

### Option 3: Railway
```bash
# Connect GitHub repo to Railway
# Add environment variables in service settings
# Deploy automatically on push to main branch
```

## 📊 Post-Deployment Checklist

- [ ] Supabase production project created
- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] Domain connected and SSL enabled
- [ ] Authentication flows tested
- [ ] User registration/login working
- [ ] Property listing functionality working
- [ ] Chat system operational
- [ ] Marketplace features working
- [ ] Mobile responsiveness verified
- [ ] Performance optimization complete
- [ ] Analytics setup (optional)
- [ ] Error monitoring configured (optional)

## 🛡️ Security Best Practices

1. **Never commit environment variables**
2. **Use Row Level Security for all tables**
3. **Implement rate limiting for API calls**
4. **Regularly update dependencies**
5. **Monitor for suspicious activity**
6. **Keep Supabase project updated**

## 📞 Support

If you encounter issues during deployment:
1. Check Supabase logs in your dashboard
2. Verify environment variables are set correctly
3. Test locally with production environment variables
4. Contact your hosting provider's support if needed

## 🎯 Production Optimization

### Performance Monitoring:
```sql
-- Monitor query performance
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE tablename IN ('users', 'properties', 'marketplace_items', 'matches');
```

### Database Optimization:
```sql
-- Analyze table statistics
ANALYZE;

-- Vacuum full (run during low traffic)
VACUUM FULL;
```

## 🔧 Common Issues & Solutions

### Environment Variable Errors
**Error:** `TypeError: Cannot read properties of undefined (reading 'VITE_SUPABASE_URL')`

**Solutions:**
1. Ensure environment variables are properly set in your hosting platform
2. Check that variables are prefixed with `VITE_` for Vite applications
3. Verify the build process has access to environment variables
4. For local development, create a `.env.local` file with your variables

### Build Failures
**Error:** Build fails with Supabase connection errors

**Solutions:**
1. Check your Supabase project URL and API key are correct
2. Ensure your Supabase project is not paused
3. Verify your environment variables are accessible during build time

### Deployment Success but App Won't Load
**Solutions:**
1. Check browser console for JavaScript errors
2. Verify all environment variables are set correctly
3. Test your Supabase connection from the browser developer tools

Remember to always test your production deployment thoroughly before going live!