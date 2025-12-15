-- Create visions_dreams table
CREATE TABLE public.visions_dreams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  background_image_url TEXT,
  audio_url TEXT,
  dreamer_name TEXT NOT NULL,
  date_received DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'dream' CHECK (category IN ('dream', 'vision')),
  scripture_reference TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('fulfilled', 'in_progress', 'waiting')),
  reflection_notes TEXT
);

-- Enable RLS
ALTER TABLE public.visions_dreams ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view visions and dreams"
ON public.visions_dreams
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert visions and dreams"
ON public.visions_dreams
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update visions and dreams"
ON public.visions_dreams
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete visions and dreams"
ON public.visions_dreams
FOR DELETE
USING (true);