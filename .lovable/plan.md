

## View and Export Program Registrations

### What Will Change

Each program card in the admin "Existing Programs" list will become clickable. Clicking it opens a dialog showing all registered participants in a table with their full details. Admins can then:

1. **Copy to clipboard** -- copies the table data as tab-separated text (pasteable into Excel/Google Sheets)
2. **Send to email** -- sends the registration data to justiceadam673@gmail.com via the existing email notification backend function

### Detailed Changes

**`src/pages/Registration.tsx`**

1. Add new state:
   - `viewingProgram` (Program | null) -- the program whose registrations are being viewed
   - `programRegistrations` (Registration[]) -- fetched registrations for that program
   - `loadingRegistrations` (boolean)
   - `sendingEmail` (boolean)

2. Add `fetchProgramRegistrations(programId)` function:
   - Queries `program_registrations` table filtered by `program_id`
   - Stores result in `programRegistrations`

3. Make each program card in the "Existing Programs" list clickable:
   - Clicking the card (not the delete button) opens a new Dialog
   - Fetches registrations for that program on open

4. Add a **Registrations Dialog** containing:
   - Program title header
   - A responsive table (using the existing Table UI components) with columns: Name, Email, Phone, Gender, Denomination, Special Request, Date Registered
   - Two action buttons at the bottom:
     - **Copy to Clipboard** -- converts registrations to tab-separated values and copies via `navigator.clipboard.writeText()`
     - **Send to Email** -- calls the existing `send-notification` edge function with a new email type `registration_report`, sending the formatted data to justiceadam673@gmail.com

5. Import `Table, TableHeader, TableBody, TableRow, TableHead, TableCell` from UI components, plus `Copy, Mail` icons from lucide-react

**`supabase/functions/send-notification/index.ts`**

Add a new email type `registration_report` to handle sending registration data:
- Accepts `programTitle`, `registrations` array, and recipient email
- Renders an HTML email with the registrations formatted as an HTML table
- Sends via Resend API to justiceadam673@gmail.com

### RLS Note
The existing RLS policy on `program_registrations` already allows admins to SELECT all registrations (`has_role(auth.uid(), 'admin')`), so no database changes are needed.

