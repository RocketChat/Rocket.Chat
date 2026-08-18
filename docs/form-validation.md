# Form Validation Guidelines

This document outlines the standardized form validation patterns and guidelines established in PR [#39590](https://github.com/RocketChat/Rocket.Chat/pull/39590) to ensure consistent user experience across Rocket.Chat forms.

## Overview

The form validation standardization aims to:
- **Improve accessibility** by keeping submit buttons enabled and letting validation run on submit
- **Provide consistent UX** with validation triggered on form submission and re-validation on field changes
- **Prevent unnecessary API calls** by using dirty-checks and appropriate revalidation modes
- **Enhance user feedback** with clear error messages and proper ARIA attributes

## Core Principles

### 1. Submit-First validation (`mode: 'onSubmit'`)

Forms should use `mode: 'onSubmit'` in react-hook-form to trigger initial validation only when the user attempts to submit the form.

**Why:** This approach improves accessibility by:
- Keeping submit buttons enabled (allowing screen readers and keyboard users to discover validation requirements)
- Avoiding premature error messages that can confuse users
- Letting users complete the form at their own pace before seeing validation feedback

**Example:**
```tsx
const {
  control,
  formState: { errors, isDirty, isSubmitting },
  handleSubmit,
} = useForm<FormData>({
  mode: 'onSubmit', // This can be omitted, `onSubmit` it's the default mode value
  defaultValues: initialData,
});
```

### 2. Smart revalidation strategy

After the first submit attempt, forms should revalidate fields intelligently:

#### Default: `reValidateMode: 'onChange'` 
For most forms, use the default onChange revalidation to provide immediate feedback as users correct errors.

#### Exception: `reValidateMode: 'onBlur'` for Async Validation
For forms with **async validation** (e.g., username availability, email uniqueness checks), explicitly set `reValidateMode: 'onBlur'` to avoid excessive API calls.

**Example with async validation:**
```tsx
const {
  control,
  formState: { errors, isDirty },
  handleSubmit,
} = useForm<FormData>({
  reValidateMode: 'onBlur', // Avoid API calls on every keystroke
  defaultValues: initialData,
});
```

### 3. Dirty-check with `useFormSubmitWithDirtyCheck`

Use the `useFormSubmitWithDirtyCheck` hook to provide user-friendly feedback when attempting to save unchanged forms.

Usually applicable on edit forms, where fields are already populated.

**Purpose:**
- Prevents unnecessary save operations on unchanged data
- Shows informative toast message: "No changes to save"
- Maintains accessibility by keeping buttons enabled

**Signature:**

Receives a callback as the first parameter (your submit handler), and an object as the second parameter containing `isDirty` and an optional `noChangesMessage` translation key, to be dispatched in the info toast.

**Usage:**

```tsx
import { useFormSubmitWithDirtyCheck } from '/hooks/useFormSubmitWithDirtyCheck';

const handleSave = useFormSubmitWithDirtyCheck(
  async (data: FormData) => {
    try {
      await saveData(data);
      dispatchToastMessage({ type: 'success', message: t('Saved') });
    } catch (error) {
      dispatchToastMessage({ type: 'error', message: error });
    }
  },
  { isDirty }
);

// In JSX:
<form onSubmit={handleSubmit(handleSave)}>
```

**When to use dirty-check:**

This hook is recommended when the same form component is used for both creation (new) and editing existing data. The hook intelligently handles both scenarios:
- ✅ **Create mode** (no existing data): Allows submission without dirty check
- ✅ **Edit mode** (existing data): Shows "No changes to save" toast when form is unchanged
- ✅ **Unified component**: Simplifies logic by handling both create and edit in one place


## Form Implementation Patterns

### Basic Form Structure

```tsx
import { useForm, Controller } from 'react-hook-form';
import { useFormSubmitWithDirtyCheck } from '../../../hooks/useFormSubmitWithDirtyCheck';

type FormData = {
  name: string;
  email: string;
};

const MyForm = ({ data, onSave }: FormProps) => {
  const { t } = useTranslation();


  const {
    control,
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
  } = useForm<FormData>({
    defaultValues: data || {},
  });

  const handleFormSubmit = useFormSubmitWithDirtyCheck(
    async (formData: FormData) => {
      await onSave(formData);
    },
    { isDirty }
  );

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} id={formId}>
      {/* Form fields */}
    </form>
  );
};
```

## Button State Management

### Submit Button States

```tsx
<Button 
  primary 
  type='submit'
  form={formId}
  loading={isSubmitting}
>
  {t('Save')}
</Button>
```

**Key Points:**
- Use `loading={isSubmitting}` to show loading state during submission
- Never disable the save button (keep enabled for a11y)
- Always connect button to form via `form={formId}` attribute



## Basic checklist

When updating an existing form to follow these guidelines:

- [ ] Use `mode` to `'onSubmit'` in `useForm`
- [ ] Add `reValidateMode: 'onBlur'` if form has async validation
- [ ] Wrap submit handler with `useFormSubmitWithDirtyCheck` (for create and edit forms)
- [ ] Add ARIA attributes: `aria-describedby`, `aria-invalid`, `role='alert'` when applicable
- [ ] Button states: `loading={isSubmitting}`, but never `disabled`
- [ ] Verify accessibility with screen reader testing

## Basic DOs and DON'Ts

### ❌ Don't: Disable buttons based on form validity

```tsx
// Bad - prevents discovery of validation requirements
<Button disabled={!isValid || !isDirty}>Save</Button>
```

### ✅ Do: Keep buttons enabled, let validation run on submit

```tsx
// Good - accessible and provides feedback
<Button 
  type='submit' 
  disabled={existingId ? !isDirty : false}
  loading={isSubmitting}
>
  Save
</Button>
```

### ❌ Don't: Use `mode: 'onChange'` for initial validation

```tsx
// Bad - shows errors immediately, poor UX
useForm({ mode: 'onChange' })
```

### ✅ Do: Use `mode: 'onSubmit'` for initial validation

```tsx
// Good - validates on submit, revalidates on change
useForm({ mode: 'onSubmit' })
```

### ❌ Don't: Use `reValidateMode: 'onChange'` with async validation

```tsx
// Bad - causes API call on every keystroke
useForm({ 
  mode: 'onSubmit',
  // Uses default 'onChange' revalidation - too many API calls!
})
```

### ✅ Do: Use `reValidateMode: 'onBlur'` with async validation

```tsx
// Good - reduces API calls while maintaining feedback
useForm({ 
  mode: 'onSubmit',
  reValidateMode: 'onBlur',
})
```

## Additional Resources

- [React Hook Form Documentation](https://react-hook-form.com/)
- [WCAG 2.1 Form Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?showtechniques=332#error-identification)
- [PR #39590 - Form Validation Standardization](https://github.com/RocketChat/Rocket.Chat/pull/39590)
