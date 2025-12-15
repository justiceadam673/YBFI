-- Create storage bucket for visions/dreams background images
INSERT INTO storage.buckets (id, name, public)
VALUES ('visions-backgrounds', 'visions-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for visions/dreams audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('visions-audio', 'visions-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for visions-backgrounds bucket
CREATE POLICY "Anyone can view visions backgrounds"
ON storage.objects FOR SELECT
USING (bucket_id = 'visions-backgrounds');

CREATE POLICY "Anyone can upload visions backgrounds"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'visions-backgrounds');

CREATE POLICY "Anyone can delete visions backgrounds"
ON storage.objects FOR DELETE
USING (bucket_id = 'visions-backgrounds');

-- Storage policies for visions-audio bucket
CREATE POLICY "Anyone can view visions audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'visions-audio');

CREATE POLICY "Anyone can upload visions audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'visions-audio');

CREATE POLICY "Anyone can delete visions audio"
ON storage.objects FOR DELETE
USING (bucket_id = 'visions-audio');