

## Registered Status and Email Reminders for Programs

### 1. Show "Registered" button for already-registered users

**File: `src/pages/Registration.tsx`**

- Add a new state `userRegistrations` (a `Set<string>` of program IDs the current user has registered for).
- On page load, query `program_registrations` filtered by `user_id = user.id` to get all program IDs the user is registered for.
- Update the realtime subscription to also refresh this set when `program_registrations` changes.
- In the program card's Register button:
  - If the user's program ID is in `userRegistrations`, show a disabled button with text **"Registered"** (green/success styling).
  - Otherwise, keep the current "Register Now" / "Closed" / "Full" logic.
- After a successful registration, immediately add the program ID to `userRegistrations` for instant UI feedback.

### 2. Automated email reminders every 2 days until the program starts

**New edge function: `supabase/functions/send-program-reminders/index.ts`**

- This function will be called on a schedule (via a cron job).
- Logic:
  1. Query all programs where `start_date > now()` and `is_active = true`.
  2. For each program, query all registrations to get participant emails and names.
  3. Send a reminder email to each registered user using the Resend API, including the program title, start date, and location.
- The function uses the `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `RESEND_API_KEY` secrets (all already configured).

**Schedule the cron job:**

- Use `pg_cron` and `pg_net` extensions to call the edge function every 2 days.
- SQL to schedule: `cron.schedule('program-reminders', '0 8 */2 * *', ...)` -- runs at 8 AM every 2 days.
- This will be set up via the SQL insert tool (not migration, since it contains project-specific URLs).

**Update `supabase/config.toml`** to add the new function with `verify_jwt = false`.

### Technical Details

**Files to create:**
- `supabase/functions/send-program-reminders/index.ts` -- new edge function for reminders

**Files to modify:**
- `src/pages/Registration.tsx` -- add `userRegistrations` state, fetch user's registrations, update button rendering
- `supabase/config.toml` -- add `send-program-reminders` function config

**Database changes:**
- Enable `pg_cron` and `pg_net` extensions
- Create a cron job to invoke the reminder function every 2 days

