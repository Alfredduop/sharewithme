-- Migration: Add bio and property_preferences to personality_quiz_results table and properties table enhancements
-- Date: 2025-01-26

-- Add bio column to store user bio/about me section
ALTER TABLE public.personality_quiz_results 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add property_preferences column to store property-related preferences  
ALTER TABLE public.personality_quiz_results 
ADD COLUMN IF NOT EXISTS property_preferences JSONB;

-- Add property preferences support to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS property_preferences JSONB;

-- Add target locations support for better matching
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS target_locations TEXT[];

-- Add comment to describe the new columns
COMMENT ON COLUMN public.personality_quiz_results.bio IS 'User bio/about me section for introducing themselves to potential flatmates';
COMMENT ON COLUMN public.personality_quiz_results.property_preferences IS 'JSON object containing property preferences like furnished room, bathroom, max flatmates, internet, parking';
COMMENT ON COLUMN public.properties.property_preferences IS 'JSON object containing what the property offers (furnished room, bathroom type, etc.)';
COMMENT ON COLUMN public.properties.target_locations IS 'Array of location names/suburbs this property can match against from room seekers';

-- Example property_preferences structure:
-- {
--   "furnished_room": "Required",
--   "bathroom": "Own bathroom (ensuite)", 
--   "max_flatmates": "2-3 flatmates",
--   "internet": "Required (fast broadband)",
--   "parking": "Required (off-street)"
-- }