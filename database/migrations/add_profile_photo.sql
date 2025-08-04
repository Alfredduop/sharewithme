-- Add profile photo URL column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN profile_photo_url TEXT;

-- Create a table to track photo uploads and metadata
CREATE TABLE user_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_photos_user_id ON user_photos(user_id);
CREATE INDEX idx_user_photos_primary ON user_photos(user_id, is_primary) WHERE is_primary = true;

-- Add RLS policies for user_photos table
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;

-- Users can only see their own photos
CREATE POLICY "Users can view own photos" ON user_photos
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own photos
CREATE POLICY "Users can insert own photos" ON user_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own photos
CREATE POLICY "Users can update own photos" ON user_photos
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own photos
CREATE POLICY "Users can delete own photos" ON user_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Update the trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_photos_updated_at BEFORE UPDATE ON user_photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create quiz_results table for detailed quiz data
CREATE TABLE quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  personality_traits JSONB,
  match_preferences JSONB,
  property_preferences JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX idx_quiz_results_completed_at ON quiz_results(completed_at);

-- Add RLS policies for quiz_results table
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Users can only see their own quiz results
CREATE POLICY "Users can view own quiz results" ON quiz_results
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own quiz results
CREATE POLICY "Users can insert own quiz results" ON quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own quiz results
CREATE POLICY "Users can update own quiz results" ON quiz_results
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own quiz results
CREATE POLICY "Users can delete own quiz results" ON quiz_results
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger for quiz_results
CREATE TRIGGER update_quiz_results_updated_at BEFORE UPDATE ON quiz_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add quiz completion fields to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN quiz_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN quiz_completed_at TIMESTAMP WITH TIME ZONE;

-- Create storage bucket for profile photos (this needs to be run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
-- VALUES ('profile-photos', 'profile-photos', true, false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Add RLS policies for the storage bucket
-- CREATE POLICY "Anyone can view profile photos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'profile-photos');

-- CREATE POLICY "Users can upload profile photos" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'profile-photos' 
--     AND auth.role() = 'authenticated'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );

-- CREATE POLICY "Users can update own profile photos" ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'profile-photos' 
--     AND auth.role() = 'authenticated'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );

-- CREATE POLICY "Users can delete own profile photos" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'profile-photos' 
--     AND auth.role() = 'authenticated'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );