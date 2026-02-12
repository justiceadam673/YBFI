

## Make the Entire Website Require Authentication

### What Will Change
Every page on the website will be protected behind a login wall. Visitors must sign in or create an account before accessing any content. After signing in or signing up, they'll be taken straight to the landing page.

### How It Works

1. **Create a `ProtectedRoute` component** (`src/components/ProtectedRoute.tsx`)
   - Wraps any page and checks if the user is logged in
   - If not logged in, redirects to `/auth`
   - Shows a loading spinner while checking authentication status

2. **Update `src/App.tsx`**
   - Wrap all routes (except `/auth`) with the `ProtectedRoute` component
   - The `/auth` page stays accessible to everyone (otherwise nobody could log in!)

3. **Update `src/pages/Auth.tsx`**
   - After successful sign-in: redirect to `/` (landing page) -- already does this
   - After successful sign-up: redirect to `/` (landing page) -- already does this
   - Already redirects logged-in users away from `/auth` -- no change needed

### Technical Details

**New file: `src/components/ProtectedRoute.tsx`**
```tsx
// A wrapper component that checks useAuth()
// If isLoading -> show spinner
// If no user -> Navigate to /auth
// If user exists -> render children
```

**Changes to `src/App.tsx`**
```tsx
// Before:
<Route path="/" element={<Index />} />

// After:
<Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
```

All routes except `/auth` will be wrapped this way. The `/auth` route remains public so users can sign in or sign up.

