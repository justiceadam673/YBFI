
ALTER TABLE public.programs ADD COLUMN custom_fields jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.program_registrations ADD COLUMN custom_field_values jsonb DEFAULT '{}'::jsonb;
