

## Navigation Restructure and Admin Program Management

### 1. Navbar Changes

**Replace standalone "Support" button and "Registration" in Admin dropdown** with a new dropdown called **"Programs & Support"** containing:
- Registration (link to `/registration` -- the user-facing program registration page)
- Support (link to `/partner`)

**Remove "Registration" from the Admin dropdown** since it moves to the new dropdown.

**Update mobile nav links** accordingly to reflect the same grouping.

### 2. Add Program List with Delete to Admin Tab

In `src/pages/Registration.tsx`, update the "Add Program" admin tab to show:
- The existing "Create a New Program" form at the top
- A new **"Existing Programs"** section below the form listing all programs (active or not) in a card/table layout
- Each program card shows title, dates, location, registration count, and a **Delete** button
- Delete button triggers a confirmation dialog, then calls `supabase.from("programs").delete().eq("id", programId)`
- Programs refresh automatically via the existing realtime subscription

### Technical Details

**Files to modify:**

1. **`src/components/Navbar.tsx`**
   - Remove the standalone `<Link to='/partner'>Support</Link>` button (lines 144-151)
   - Remove "Registration" from Admin dropdown (lines 176-181)
   - Add a new `<DropdownMenu>` between Q&A and Admin labeled "Programs & Support" with two items: "Registration" (`/registration`) and "Support" (`/partner`)
   - Update `navLinks` array for mobile: remove standalone "Support" and "Registration" entries, or relabel for clarity

2. **`src/pages/Registration.tsx`**
   - Import `Trash2` icon from lucide-react and `AlertDialog` components
   - Add `handleDeleteProgram(id)` function that deletes from `programs` table
   - Add `allPrograms` state (fetches all programs regardless of `is_active` for admin view)
   - In the "Add Program" tab content, add a section below the form showing all programs as cards with delete buttons
   - Add a confirmation alert dialog before deletion

