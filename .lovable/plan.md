

## Edit Programs, Custom Fields, and Enhanced Admin Cards

### Overview

Add editing capabilities to the admin program list, support for custom registration fields per program, and show program images in the admin list with a more visually appealing card design.

### 1. Database Change

Add a `custom_fields` JSONB column to the `programs` table to store dynamic input definitions per program.

```sql
ALTER TABLE programs ADD COLUMN custom_fields jsonb DEFAULT '[]'::jsonb;
```

Each custom field will be stored as: `[{ "id": "uuid", "label": "Shirt Size", "required": false }, ...]`

Also add a `custom_field_values` JSONB column to `program_registrations` to store user responses:

```sql
ALTER TABLE program_registrations ADD COLUMN custom_field_values jsonb DEFAULT '{}'::jsonb;
```

### 2. Admin Program List -- Enhanced Cards with Image and Edit Button

Each program card in the "Existing Programs" section will be redesigned:
- Show the program image as a small thumbnail on the left side of the card
- Add an **Edit** (pencil icon) button next to the existing Delete button
- Keep the click-to-view-registrations behavior
- More visually distinct styling with gradient accents

### 3. Edit Program Dialog

A new dialog that opens when clicking the Edit button, pre-filled with the program's current data:
- All existing fields (title, description, dates, location, max participants, image)
- Option to upload a new image (replacing the old one)
- A "Custom Fields" section at the bottom with:
  - A list of existing custom fields (label + required toggle + delete button)
  - An "Add Field" button that adds a new row with a label input and a required checkbox
- Save button that updates the program in the database

### 4. Registration Form -- Dynamic Custom Fields

When a user opens the registration dialog:
- After the standard fields (name, email, phone, gender, denomination, special request), render any custom fields defined for the selected program
- Each custom field renders as a text input with its label
- Values are saved to the `custom_field_values` JSONB column in `program_registrations`

### 5. Registrations Viewer -- Show Custom Fields

The registrations table dialog will also display any custom field values as additional columns.

### Technical Details

**Files to modify:**
- `src/pages/Registration.tsx` -- add edit dialog, custom fields UI in both create and edit forms, render custom fields in registration form, show images in admin list, display custom field values in registrations viewer

**Database migration:**
- Add `custom_fields` (jsonb, default `'[]'`) to `programs`
- Add `custom_field_values` (jsonb, default `'{}'`) to `program_registrations`

**New state/interfaces:**
- `CustomField` interface: `{ id: string; label: string; required: boolean }`
- `editingProgram` state for the edit dialog
- `editForm` state mirroring programForm plus `custom_fields` array
- `editImageFile` for optional image replacement

**No RLS changes needed** -- existing admin policies on `programs` already allow UPDATE.

