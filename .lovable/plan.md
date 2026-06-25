## Plan: Beautiful Participant Tag Card with Unique Code & Photo

### What the user gets
After successfully registering for a program, a beautiful **Participant Tag Card** appears in a dialog showing their name, program details, an image slot, and a unique identity code. They can upload their own photo into the slot, then download the tag as an image.

### 1. Database Change
Add a `participant_code` column to `program_registrations`:
- `participant_code` (text, unique, nullable) — a short human-friendly code like `YBFI-7K3M9Q`
- Generated client-side at registration time (e.g. program prefix + random 6-char base36), checked unique via the unique constraint

### 2. New Component: `ParticipantTag.tsx`
A polished, attractive ID-badge style card built with the existing design tokens (blue/white/gold, glass morphism, gradients). Contents:
- Header with YBFI branding/logo accent and program title
- Circular photo slot (placeholder avatar icon when empty) with an "Upload Photo" button
- Participant name (large), email, phone, gender, denomination
- Program dates & location
- A highlighted **unique code** block at the bottom (monospace, with a subtle badge / "Participant ID" label)
- Decorative gradient background and gold accents for an attractive look

### 3. Photo Upload Slot
- A file input lets the user pick an image before downloading
- The chosen image is shown in the circular slot (object URL preview)
- Accepts jpeg/png/webp (consistent with existing image handling)

### 4. Download as Image
- Add the `html-to-image` package
- A "Download Tag" button captures the tag card DOM node to PNG and triggers download (`<name>-ybfi-tag.png`)

### 5. Wire into Registration flow
In `src/pages/Registration.tsx`:
- Generate `participant_code` and include it in the insert in `handleRegister`
- On success, instead of just a toast, open a new **Tag dialog** showing `<ParticipantTag>` populated with the just-submitted details and code
- Keep the existing "Registered" disabled-button behavior intact

### Files
- **Migration**: add `participant_code` unique column
- **New** `src/components/ParticipantTag.tsx`
- **Modify** `src/pages/Registration.tsx` — generate code, store it, open tag dialog after register
- **Add dependency**: `html-to-image`

### Notes
- The photo is only embedded into the downloadable tag image; it is not uploaded to storage (no backend storage needed for the tag photo). If you'd prefer the photo saved to the cloud too, say so and I'll add that.
- Unique code uniqueness is enforced by the DB constraint with a small retry on collision.