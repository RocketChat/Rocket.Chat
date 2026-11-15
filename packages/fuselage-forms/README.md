# `@rocket.chat/fuselage-forms`

> Accessible form fields for Fuselage: inputs that wire up their label, description, hint and error automatically.

[![npm](https://img.shields.io/npm/v/@rocket.chat/fuselage-forms?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/fuselage-forms) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/fuselage-forms?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/fuselage-forms)

This package wraps the field and input components of [`@rocket.chat/fuselage`](https://www.npmjs.com/package/@rocket.chat/fuselage). Inside a `Field`, the wrapped components generate their own ids and set the ARIA attributes that tie an input to its label and messages, so you do not pass `id`, `htmlFor`, `aria-labelledby` or `aria-describedby` by hand.

- The input is labelled by its `FieldLabel`, whichever way the input needs it (`htmlFor`, `aria-labelledby`, or a visually hidden label for checkboxes, radio buttons and toggles).
- `aria-describedby` points at the `FieldDescription`, `FieldError` and `FieldHint` that are rendered.
- `aria-invalid` is `true` while a `FieldError` is rendered, and the error is announced with `role="alert"`.
- Clicking the label of a checkbox, radio button or toggle switch activates it.

## Installation

```sh
npm install @rocket.chat/fuselage-forms @rocket.chat/fuselage @rocket.chat/fuselage-hooks react@19 react-dom@19
```

`@rocket.chat/fuselage`, `@rocket.chat/fuselage-hooks`, `react` and `react-dom` are peer dependencies. `@rocket.chat/fuselage` has its own peer dependencies and stylesheet; see its README. The components rely on React 19 (they read `ref` as a regular prop).

The package ships CommonJS and ES module builds with TypeScript declarations.

## Usage

Import the field parts and the inputs from this package instead of from `@rocket.chat/fuselage`:

```tsx
import { Field, FieldDescription, FieldError, FieldHint, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage-forms';
import { useState } from 'react';

function EmailField() {
	const [email, setEmail] = useState('');
	const invalid = email !== '' && !email.includes('@');

	return (
		<Field>
			<FieldLabel required>Email</FieldLabel>
			<FieldDescription>We send the confirmation link here.</FieldDescription>
			<FieldRow>
				<TextInput value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
			</FieldRow>
			{invalid && <FieldError>Enter a valid email address</FieldError>}
			<FieldHint>You can change it later in your account settings.</FieldHint>
		</Field>
	);
}
```

The input gets an id that matches the label's `htmlFor`, `aria-describedby` lists the description, error and hint, and `aria-invalid` follows the error.

### Checkboxes, radio buttons and toggle switches

Put the label and the control in the same `FieldRow`. The control renders a visually hidden copy of the label text, and clicking the visible label toggles it:

```tsx
import { Field, FieldDescription, FieldLabel, FieldRow, ToggleSwitch } from '@rocket.chat/fuselage-forms';

<Field>
	<FieldRow>
		<FieldLabel>Email notifications</FieldLabel>
		<ToggleSwitch defaultChecked />
	</FieldRow>
	<FieldDescription>Send a summary of unread messages every day.</FieldDescription>
</Field>;
```

### Grouping fields

`FieldGroup`, `FieldRow`, `FieldLink` and `FieldLabelInfo` are re-exported from `@rocket.chat/fuselage` unchanged, so a whole form can import from one place:

```tsx
import { Field, FieldGroup, FieldLabel, FieldLabelInfo, FieldRow, PasswordInput, TextInput } from '@rocket.chat/fuselage-forms';

<FieldGroup>
	<Field>
		<FieldLabel>Username</FieldLabel>
		<FieldRow>
			<TextInput />
		</FieldRow>
	</Field>
	<Field>
		<FieldLabel>
			Password
			<FieldLabelInfo title='At least 8 characters' />
		</FieldLabel>
		<FieldRow>
			<PasswordInput />
		</FieldRow>
	</Field>
</FieldGroup>;
```

### Custom inputs

To connect your own input to a `Field`, use one of the context hooks and spread its result onto the element:

```tsx
import { useFieldReferencedByInput } from '@rocket.chat/fuselage-forms';

function ColorInput(props: { value: string; onChange: (value: string) => void }) {
	const fieldProps = useFieldReferencedByInput(); // { id, 'aria-describedby', 'aria-invalid' }

	return <input type='color' {...fieldProps} value={props.value} onChange={(e) => props.onChange(e.currentTarget.value)} />;
}
```

## API

### Field parts

| Export                                                  | Description                                                                                         |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Field`                                                 | Fuselage `Field` wrapped in a `FieldProvider`. Every labelled input needs one.                      |
| `FieldLabel`                                            | Renders the right kind of label for the input in the same `Field`.                                  |
| `FieldDescription`                                      | Fuselage `FieldDescription`, registered as a description of the input.                              |
| `FieldError`                                            | Fuselage `FieldError` with `role="alert"`; marks the input as invalid while rendered.               |
| `FieldHint`                                             | Fuselage `FieldHint`, registered as a description of the input.                                     |
| `FieldProvider`                                         | Context provider used by `Field`. Use it directly to give a field context to a different container. |
| `LabelFor`, `ReferencedLabel`, `HiddenLabel`            | The three label variants `FieldLabel` chooses from. Use them only to force a variant.               |
| `FieldGroup`, `FieldRow`, `FieldLink`, `FieldLabelInfo` | Re-exported from `@rocket.chat/fuselage`.                                                           |

### Inputs

Each input takes the same props as the Fuselage component with the same name.

| Labelled by                         | Inputs                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `<label htmlFor>` and an input `id` | `TextInput`, `EmailInput`, `PasswordInput`, `SearchInput`, `TextAreaInput`, `NumberInput`, `UrlInput` |
| `aria-labelledby`                   | `Select`, `Slider`, `MultiSelect`, `MultiSelectFiltered`, `AutoComplete` (deprecated)                 |
| A visually hidden label             | `CheckBox`, `RadioButton`, `ToggleSwitch`                                                             |

`AutoComplete` is deprecated; use `MultiSelectFiltered`, or `SelectFiltered` from `@rocket.chat/fuselage` for single selection.

### Context hooks

| Hook                                | Returns                                                                                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useFieldReferencedByInput()`       | `{ id, 'aria-describedby', 'aria-invalid' }` for an input that a `<label htmlFor>` points at.                                                                         |
| `useFieldReferencedByLabel()`       | `{ 'aria-labelledby', 'aria-describedby', 'aria-invalid' }` for a control labelled by the label's id.                                                                 |
| `useFieldReferencedByLabelWithId()` | Same as above, plus an `id` (for controls that need one for `aria-controls`).                                                                                         |
| `useFieldWrappedByInputLabel()`     | `[label, props, ref]`: the label content to render hidden, the ARIA props, and a ref for the control, which is focused and clicked when the visible label is clicked. |
| `useFieldLabel()`                   | `[ref, id]` for building a custom label.                                                                                                                              |
| `useFieldDescriptorId(type)`        | Registers a `'description'`, `'error'`, `'hint'` or `'placeholder'` element and returns its id.                                                                       |
| `useFieldFieldType()`               | The current field type: `'referencedByInput'`, `'referencedByLabel'` or `'wrappedByLabel'`.                                                                           |

`FieldContext` and the types `FieldContextValue`, `FieldType` and `LabelTypes` are exported for advanced use.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/fuselage-forms). From the repository root:

```sh
yarn workspace @rocket.chat/fuselage-forms build
yarn workspace @rocket.chat/fuselage-forms testunit
yarn workspace @rocket.chat/fuselage-forms typecheck
yarn workspace @rocket.chat/fuselage-forms lint
yarn workspace @rocket.chat/fuselage-forms lint:fix
```

Run Storybook to try every input inside a `Field`:

```sh
yarn workspace @rocket.chat/fuselage-forms storybook
yarn workspace @rocket.chat/fuselage-forms build-storybook
```

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
