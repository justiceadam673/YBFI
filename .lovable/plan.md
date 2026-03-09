

## Plan: Speaker Field, Pagination, and Voice Recording for Messages

### 1. Database Migration
Add two new nullable columns to the `messages` table:
- `speaker` (text, nullable) -- speaker/preacher name
- `is_voice_note` (boolean, default false) -- to distinguish voice notes from uploaded messages for styling

### 2. Speaker Field in Add Message Dialog
- Add a "Speaker / Preacher Name" input field to both the Add Message form and the Record Voice Note form
- Display the speaker name on each message card (below the title)
- Add a search/filter input above the messages list to filter by speaker name (client-side filter on fetched data, or query param)

### 3. Pagination (10 per page)
- Add `currentPage` state, default 1
- Fetch all messages but display only 10 per page using slice
- Add pagination controls (Previous / page numbers / Next) below the messages list using the existing `Pagination` UI components

### 4. Record Voice Note Button + Dialog
- Add a "Record Voice Note" button next to "Add Message" with a distinct color (e.g., a red/rose variant)
- New dialog with:
  - Admin password gate (reuse same pattern)
  - Title input + Speaker input
  - Record controls: Start / Stop / Play preview using `MediaRecorder` API
  - Visual recording indicator (pulsing red dot + elapsed time)
  - Save button that uploads the recorded blob to the `messages` storage bucket and inserts a DB row with `is_voice_note = true`
- Uses `navigator.mediaDevices.getUserMedia({ audio: true })` for live mic access
- Records to webm/opus format, uploads as-is

### 5. Visual Distinction for Voice Notes
- Voice note cards use a different gradient icon color (e.g., rose/red gradient with a Mic icon instead of Play)
- Subtle left border accent or different card background tint to distinguish from uploaded messages

### Files to modify
- **Database migration**: Add `speaker` and `is_voice_note` columns
- **`src/pages/Messages.tsx`**: All UI changes (speaker field, pagination, recording dialog, card styling)

### Technical Notes
- `MediaRecorder` API is well-supported in modern browsers; no extra dependencies needed
- Audio is recorded as `audio/webm` blob, uploaded to the existing `messages` storage bucket
- Pagination is client-side since message counts should be manageable; can switch to server-side if needed later

