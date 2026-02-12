

## Plan: Program Registration System + Auth Redirect Fix

### 1. Auth Redirect (Already Done)
The authentication wall is already in place from the previous implementation. The `ProtectedRoute` component wraps all routes except `/auth`, so visiting `ybfi.vercel.app` while logged out already redirects to the auth page. No changes needed here.

### 2. Database Setup
Create two new tables:

**`programs` table** - stores programs created by admins:
- `id` (uuid, primary key)
- `created_at` (timestamp)
- `title` (text, required)
- `description` (text)
- `image_url` (text)
- `start_date` (date) - program start
- `end_date` (date) - program end
- `registration_deadline` (date) - last day to register
- `location` (text)
- `max_participants` (integer)
- `is_active` (boolean, default true)
- `created_by` (uuid, references auth.users)

**`program_registrations` table** - stores user registrations:
- `id` (uuid, primary key)
- `created_at` (timestamp)
- `program_id` (uuid, references programs)
- `user_id` (uuid, references auth.users)
- `name` (text, required)
- `email` (text, required)
- `phone` (text, required)
- `gender` (text, required)
- `denomination` (text)
- `special_request` (text)
- `status` (text, default 'registered')

**Storage bucket**: `program-images` (public) for program images.

**RLS Policies**:
- Programs: anyone authenticated can SELECT; only admins can INSERT/UPDATE/DELETE (using `has_role` function)
- Registrations: authenticated users can INSERT their own; admins can SELECT all; users can SELECT their own

### 3. New Page: `src/pages/Registration.tsx`
A dynamic page with two main sections accessed via tabs/buttons:

**"Add Program" (Admin Only)**:
- Protected by admin role check (using `isAdmin` from `useAuth`)
- Form fields: title, description, image upload, start/end dates, registration deadline, location, max participants
- Image uploaded to `program-images` storage bucket
- Matching the elegant design system with glass cards, animations, hero section

**"Register for a Program" (All Users)**:
- Displays all active programs as beautiful cards with images, dates, and details
- Click a program to open a registration dialog/form
- Auto-fills name and email from user profile
- Fields: name, email, phone, gender (select), denomination, special request
- Shows registration deadline and remaining spots
- Confirmation toast on successful registration

### 4. Route and Navigation Updates

**`src/App.tsx`**: Add new route `/registration` wrapped in `ProtectedRoute`

**`src/components/Navbar.tsx`**:
- Add "Registration" link under the Admin dropdown (desktop)
- Add "Registration" link in mobile nav menu

### Technical Details

**Files to create:**
- `src/pages/Registration.tsx` - main registration page

**Files to modify:**
- `src/App.tsx` - add route
- `src/components/Navbar.tsx` - add nav links

**Database migration:**
- Create `programs` table with RLS
- Create `program_registrations` table with RLS
- Create `program-images` storage bucket
- Enable realtime on both tables for live updates

**Design:** Hero section with gradient, glass cards for programs, animated transitions, responsive grid layout -- consistent with the existing elegant design system used across the site.

