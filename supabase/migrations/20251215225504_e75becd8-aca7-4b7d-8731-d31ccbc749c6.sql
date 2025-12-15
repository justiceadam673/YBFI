-- Create prayer requests table
CREATE TABLE public.prayer_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  prayer TEXT NOT NULL,
  prayer_count INTEGER NOT NULL DEFAULT 0,
  is_anonymous BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view prayer requests"
ON public.prayer_requests
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert prayer requests"
ON public.prayer_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update prayer count"
ON public.prayer_requests
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_requests;