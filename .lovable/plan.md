

## Fix Message Upload and Add Loading Spinner

### Problem Analysis

After thorough investigation, the backend (storage bucket, RLS policies, edge function, database) all appear correctly configured. The most likely issues are:

1. **Storage upload may be failing silently** -- the `return` statement after `uploadError` exits the `try` block, and while `finally` does set `isUploading(false)`, the toast error may not be visible enough or the error object might not have a `.message` property.
2. **File reference could be lost** -- when spreading `newMessage` in onChange handlers, the `file` property could be overwritten back to `null` if React batches state updates.
3. **The file input needs a `ref`** to properly reset after upload.

### Changes to `src/pages/Messages.tsx`

1. **Use a `ref` for the file input** so it can be properly reset and the file is reliably captured.

2. **Store the file separately** from the `newMessage` state to avoid it being accidentally overwritten during state spreading. Keep `audioFile` as its own `useState<File | null>`.

3. **Add a loading spinner to the "Verify" button** too, so it doesn't feel unresponsive when checking the admin password.

4. **Add `console.log` breadcrumbs** at each step (start, file selected, upload start, upload success, DB insert) for easier debugging.

5. **Ensure the toast shows proper errors** by safely accessing error properties: `uploadError?.message || JSON.stringify(uploadError)`.

6. **Reset the file input element** using the ref after successful upload: `fileInputRef.current.value = ''`.

7. **Add `type="button"`** to the "Add Message" and "Verify" buttons to prevent any accidental form submission behavior.

### Technical Details

**File modified:** `src/pages/Messages.tsx`

**Key state changes:**
- Add `const [audioFile, setAudioFile] = useState<File | null>(null)` -- separate from `newMessage`
- Add `const fileInputRef = useRef<HTMLInputElement>(null)` -- for resetting the file input
- Add `const [isVerifying, setIsVerifying] = useState(false)` -- spinner for verify button
- Remove `file` from `newMessage` state object

**Upload handler changes:**
- Reference `audioFile` instead of `newMessage.file`
- Add console logs at each step for debugging
- Safely stringify error messages
- Reset `audioFile` and file input ref on success

**UI changes:**
- Verify button shows spinner while checking password
- Add Message button shows spinner while uploading (already exists but ensure it works with separate file state)
- Add `type="button"` to prevent form submission

