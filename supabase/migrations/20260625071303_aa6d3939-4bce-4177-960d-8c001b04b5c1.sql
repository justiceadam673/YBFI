CREATE POLICY "Users can update their own registrations"
ON public.program_registrations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);