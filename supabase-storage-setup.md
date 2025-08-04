# Supabase Setup for Share With Me Platform

This guide explains how to set up Supabase for the complete Share With Me platform, including authentication, database tables, and storage buckets.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new Supabase project
3. Note your Project URL and API Key from Settings → API

## Environment Variables

Create a `.env.local` file in your project root with:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Required Storage Buckets

### 1. user-documents (CRITICAL for ID verification)
This bucket stores government ID documents and selfies for identity verification.

**To create this bucket:**

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Set the bucket name to: `user-documents`
5. **Important: Keep the bucket PRIVATE** (do not make it public)
6. Click **Create bucket**

### 2. profile-photos
This bucket stores user profile photos.

**To create this bucket:**

1. Follow the same steps as above
2. Set the bucket name to: `profile-photos`
3. **Keep this bucket PRIVATE** as well
4. Click **Create bucket**

## Required Database Tables

The following tables will be created automatically when users interact with the app, but you can create them manually if needed:

### Core Tables:
- `user_profiles` - User profile information
- `user_photos` - Profile photo records
- `property_listings` - Property listings from landlords
- `quiz_results` - Personality quiz results
- `support_requests` - Customer support tickets

## Storage Policies (CRITICAL - Must be set up)

### For user-documents bucket:

1. Go to **Storage** → **Policies** in your Supabase dashboard
2. Create the following RLS policies for the `user-documents` bucket:

#### Policy 1: Allow authenticated users to upload their own files
```sql
CREATE POLICY "Users can upload their own verification documents" ON storage.objects
FOR INSERT WITH CHECK (
  auth.uid()::text = (storage.foldername(name))[1]
  AND bucket_id = 'user-documents'
);
```

#### Policy 2: Allow users to view their own files
```sql
CREATE POLICY "Users can view their own verification documents" ON storage.objects
FOR SELECT USING (
  auth.uid()::text = (storage.foldername(name))[1]
  AND bucket_id = 'user-documents'
);
```

#### Policy 3: Allow admin users to view all files (optional)
```sql
CREATE POLICY "Admins can view all verification documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-documents'
  AND auth.jwt() ->> 'role' = 'admin'
);
```

### For profile-photos bucket:

#### Policy 1: Allow authenticated users to upload their own photos
```sql
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  auth.uid()::text = (storage.foldername(name))[1]
  AND bucket_id = 'profile-photos'
);
```

#### Policy 2: Allow users to view their own photos
```sql
CREATE POLICY "Users can view their own profile photos" ON storage.objects
FOR SELECT USING (
  auth.uid()::text = (storage.foldername(name))[1]
  AND bucket_id = 'profile-photos'
);
```

#### Policy 3: Allow public viewing of profile photos (optional - for public profiles)
```sql
CREATE POLICY "Public can view profile photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profile-photos'
);
```

## File Organization

Files will be organized in the following structure:
```
user-documents/
  verification/
    id_1234567890.jpg
    selfie_1234567890.jpg
    id_1234567891.pdf
    selfie_1234567891.jpg
```

## Security Features

1. **Private Bucket**: Documents are not publicly accessible
2. **RLS Policies**: Users can only access their own documents
3. **Authentication Required**: Only logged-in users can upload
4. **File Validation**: Client-side validation for file types and sizes
5. **Encryption**: All files are encrypted at rest by Supabase

## File Limits

- **Maximum file size**: 10MB per file
- **Allowed formats**: JPG, PNG, PDF
- **Storage limit**: Set by your Supabase plan

## Environment Variables Required

Make sure these are set in your `.env.local` file:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Quick Setup Checklist

- [ ] Create Supabase project
- [ ] Add environment variables to `.env.local`
- [ ] Create `user-documents` storage bucket (private)
- [ ] Create `profile-photos` storage bucket (private)
- [ ] Set up RLS policies for both buckets
- [ ] Test file upload in ID verification
- [ ] Restart your development server

## Testing the Setup

1. Restart your development server after adding environment variables
2. Go to the signup flow and reach the ID verification step
3. Try uploading a test image or PDF
4. Check that files appear in the Supabase Storage dashboard
5. Verify that upload progress shows correctly

## Troubleshooting

### Common Issues:

**"Database Connection Required" warning:**
- Supabase environment variables are missing or incorrect
- Check your `.env.local` file exists and has correct values
- Restart the development server

**"bucket not found" error:**
- Ensure the `user-documents` and `profile-photos` buckets exist
- Check bucket name spelling (case-sensitive)
- Verify buckets are created in the correct Supabase project

**Upload permission denied:**
- RLS policies are missing or incorrect
- User must be authenticated before uploading
- Check that policies match the code patterns exactly

**File not accessible:**
- Check that the correct storage policies are in place
- Verify the file path structure matches expectations
- Ensure buckets are private, not public

**"SUPABASE_REQUIRED" error:**
- This means the app detected Supabase isn't properly configured
- Follow the setup steps above
- The app will not allow file uploads without real Supabase

### Getting Help

If you're still having issues:

1. Check the browser console for detailed error messages
2. Verify your Supabase project is active and accessible
3. Test your credentials by accessing the Supabase dashboard
4. Ensure your Supabase project has sufficient storage quota

### Supabase Configuration Verification

You can verify your setup is working by:
1. Checking that the signup flow works
2. Confirming file uploads complete successfully
3. Viewing uploaded files in the Supabase Storage dashboard
4. Testing the complete ID verification flow