ALTER TABLE public.messages ADD COLUMN speaker text;
ALTER TABLE public.messages ADD COLUMN is_voice_note boolean NOT NULL DEFAULT false;