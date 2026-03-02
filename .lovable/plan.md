
## Fix Message Upload Reliability + Visible Loading Spinner

### What I found
I checked the current `Messages` page implementation and backend configuration end-to-end:

- File storage bucket for messages exists and allows uploads.
- Messages table insert policy allows inserts.
- Admin password verification backend function is working and returns valid responses.
- So this is most likely a frontend flow/state issue, not a backend permission issue.

The current UI already has an upload spinner state, but it can fail to appear when the handler exits early (especially if file state is lost or validation fails silently from the user perspective).

### Implementation approach

### 1) Make file handling reliable in `src/pages/Messages.tsx`
- Add `audioFile` as its own state (`File | null`) instead of nesting file inside `newMessage`.
- Keep `newMessage` for text fields only (`title`, `date`).
- Use functional state updates for text fields:
  - `setNewMessage((prev) => ({ ...prev, title: ... }))`
  - `setNewMessage((prev) => ({ ...prev, date: ... }))`
- Add `fileInputRef` so the file input can be reset safely after success.

Why: this removes accidental overwrite risk and makes validation deterministic.

### 2) Add a dedicated loader for password verification
- Add `isVerifying` state.
- In `verifyPassword`, set `isVerifying(true)` before invoking backend and always reset in `finally`.
- Disable Verify button while verifying.
- Show `<Loader2 className="animate-spin" />` + “Verifying...” text.

Why: user gets immediate feedback for the first step of the upload flow too.

### 3) Harden the upload handler for clear UX and easier debugging
In `handleAddMessage`:
- Guard against re-entry: return early if `isUploading` is already true.
- Validate `title`, `date`, and `audioFile` (not nested object file).
- Keep `setIsUploading(true)`/`finally setIsUploading(false)` as strict envelope.
- Upload file with explicit options (`upsert: false`, optional `contentType: audioFile.type`).
- Build public URL from returned upload path.
- Insert DB row only after successful upload.
- Use safe error extraction in toasts:
  - `error?.message || JSON.stringify(error)`
- Add clear step logs:
  - start upload
  - upload success
  - db insert success/failure

Why: guarantees spinner lifecycle and gives actionable error feedback if anything fails.

### 4) Ensure button behavior is explicit
- Set `type="button"` on Verify and Add Message buttons.
- Keep Add Message button disabled while `isUploading`.
- Add spinner+text swap for Add Message:
  - `Uploading...` with animated loader icon.

Why: prevents accidental default submit behavior and ensures visible progress state.

### 5) Reset dialog/form state cleanly after success and close
After successful upload:
- reset title/date
- reset `audioFile`
- clear file input DOM value via ref
- close dialog
- clear auth/password state
- refetch messages list

Also handle dialog close (`onOpenChange`) to optionally clear stale form/auth state so reopening starts clean.

---

## Technical change scope

### File to modify
- `src/pages/Messages.tsx`

### No backend schema/policy changes needed
- Database and storage access are already correctly configured for this flow.

---

## Acceptance checklist (what I will verify after implementing)

1. Verify button shows spinner and disables while checking password.
2. Add Message button shows spinner and disables while uploading.
3. Successful upload:
   - file appears in storage bucket,
   - message row is inserted in database,
   - new card appears immediately after refresh/fetch.
4. Failed upload/insert shows descriptive error toast.
5. Reopening dialog does not keep stale file/password state.
