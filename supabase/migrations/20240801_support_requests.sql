-- Create support_requests table for logging all support interactions
CREATE TABLE support_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name text NOT NULL,
  user_email text NOT NULL,
  user_id uuid REFERENCES users(id),
  chat_history text NOT NULL,
  is_urgent boolean DEFAULT false,
  email_sent boolean DEFAULT false,
  email_id text, -- Resend email ID
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'responded', 'resolved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_agent text,
  current_url text,
  response_time_minutes integer, -- Track response time
  resolved_at timestamptz
);

-- Create support_analytics table for tracking support metrics
CREATE TABLE support_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  user_email text,
  request_type text CHECK (request_type IN ('urgent', 'normal')),
  message_count integer,
  sent_successfully boolean DEFAULT false,
  timestamp timestamptz DEFAULT now()
);

-- Create support_requests_fallback for when all email services fail
CREATE TABLE support_requests_fallback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name text NOT NULL,
  user_email text NOT NULL,
  user_id uuid REFERENCES users(id),
  chat_history text NOT NULL,
  is_urgent boolean DEFAULT false,
  status text DEFAULT 'pending_manual_processing',
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by text
);

-- Create indexes for better performance
CREATE INDEX idx_support_requests_user_id ON support_requests(user_id);
CREATE INDEX idx_support_requests_created_at ON support_requests(created_at);
CREATE INDEX idx_support_requests_status ON support_requests(status);
CREATE INDEX idx_support_requests_is_urgent ON support_requests(is_urgent);
CREATE INDEX idx_support_requests_email_sent ON support_requests(email_sent);

CREATE INDEX idx_support_analytics_timestamp ON support_analytics(timestamp);
CREATE INDEX idx_support_analytics_request_type ON support_analytics(request_type);

CREATE INDEX idx_support_fallback_status ON support_requests_fallback(status);
CREATE INDEX idx_support_fallback_created_at ON support_requests_fallback(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_support_requests_updated_at 
    BEFORE UPDATE ON support_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for support team dashboard
CREATE VIEW support_dashboard AS
SELECT 
  sr.id,
  sr.user_name,
  sr.user_email,
  sr.is_urgent,
  sr.status,
  sr.created_at,
  sr.updated_at,
  sr.response_time_minutes,
  CASE 
    WHEN sr.is_urgent AND sr.status = 'sent' AND (now() - sr.created_at) > INTERVAL '1 hour' THEN 'overdue'
    WHEN NOT sr.is_urgent AND sr.status = 'sent' AND (now() - sr.created_at) > INTERVAL '24 hours' THEN 'overdue'
    WHEN sr.status = 'pending' THEN 'needs_attention'
    ELSE 'on_track'
  END as urgency_status
FROM support_requests sr
ORDER BY 
  sr.is_urgent DESC,
  sr.created_at DESC;

-- Insert some example data to test (remove in production)
INSERT INTO support_requests (
  user_name, 
  user_email, 
  chat_history, 
  is_urgent, 
  email_sent, 
  status
) VALUES 
(
  'Test User', 
  'test@example.com', 
  'Test support request for verification', 
  false, 
  true, 
  'sent'
);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON support_requests TO authenticated;
GRANT SELECT, INSERT ON support_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON support_requests_fallback TO authenticated;
GRANT SELECT ON support_dashboard TO authenticated;

-- RLS Policies
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests_fallback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own support requests
CREATE POLICY "Users can view own support requests" ON support_requests
  FOR SELECT USING (user_id = auth.uid() OR user_email = auth.email());

-- Policy: Allow service role to manage all records (for edge functions)
CREATE POLICY "Service role can manage all support requests" ON support_requests
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all analytics" ON support_analytics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all fallback" ON support_requests_fallback
  FOR ALL USING (auth.role() = 'service_role');