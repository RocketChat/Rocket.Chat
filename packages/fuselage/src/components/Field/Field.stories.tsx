import type { Meta, StoryObj } from '@storybook/react';

import { CheckBox } from '../CheckBox';
import { PasswordInput } from '../PasswordInput';
import { RadioButton } from '../RadioButton';
import { TextAreaInput } from '../TextAreaInput';
import { TextInput } from '../TextInput';
import { ToggleSwitch } from '../ToggleSwitch';
import Field from './Field';
import FieldDescription from './FieldDescription';
import FieldError from './FieldError';
import FieldHint from './FieldHint';
import FieldLabel from './FieldLabel';
import FieldLabelInfo from './FieldLabelInfo';
import FieldLink from './FieldLink';
import FieldRow from './FieldRow';

export default {
	title: 'Inputs/Field',
	component: Field,
	subcomponents: {
		FieldDescription,
		FieldError,
		FieldHint,
		FieldLabel,
		FieldLabelInfo,
		FieldLink,
		FieldRow,
	},
	parameters: {
		docs: {
			usage: `
- Put the input in a \`FieldRow\`. For a \`CheckBox\`, \`RadioButton\` or \`ToggleSwitch\`, put the \`FieldLabel\` and the control in the same \`FieldRow\`.
- Keep the copy clear, concise and consistent across the product.

**Labels**

- Describe the information needed with a specific \`FieldLabel\`. Avoid generic labels, and don't assign ownership when it isn't needed.
- Set \`required\` on the label of every required field.
- Add a \`FieldLabelInfo\` only when the field needs an explanation in a tooltip.

**Descriptions and hints**

- Use a \`FieldDescription\` for context or instructions that clear up the label. Keep it short and non-technical, and move complex details to a \`FieldHint\`.
- Use a \`FieldHint\` to explain technical terms, concepts or behaviors, and to clear up ambiguities.

**Placeholders**

- Set a \`placeholder\` on the input only when an example helps the user formulate the value; it disappears once they type, so a \`FieldHint\` usually serves better. Never repeat the label in it.

**Errors**

- In a \`FieldError\`, say what is wrong and how to fix it. Be specific and actionable; don't apologize or stay vague.
- Follow the patterns "Invalid email address" and "Email required" ("Invalid URL", "Username required"). For several values, write "One or more invalid email addresses".
`,
		},
	},
} satisfies Meta<typeof Field>;

type Story = StoryObj<typeof Field>;

export const WithTextInput: Story = {
	render: () => (
		<Field>
			<FieldLabel required htmlFor='fieldWithText'>
				Label
				<FieldLabelInfo id='fieldWithTextInfo' title='this is a info label' />
			</FieldLabel>
			<FieldDescription>Description</FieldDescription>
			<FieldRow>
				<TextInput id='fieldWithText' aria-describedby='fieldWithTextInfo' />
			</FieldRow>
			<FieldError>Error feedback</FieldError>
			<FieldRow>
				<FieldHint>Hint</FieldHint>
				<FieldLink href='#'>Link</FieldLink>
			</FieldRow>
		</Field>
	),
};

export const WithTextArea: Story = {
	render: () => (
		<Field>
			<FieldLabel required htmlFor='fieldWithTextArea'>
				Label
				<FieldLabelInfo id='fieldWithTextAreaInfo' title='this is a info label' />
			</FieldLabel>
			<FieldDescription>Description</FieldDescription>
			<FieldRow>
				<TextAreaInput id='fieldWithTextArea' aria-describedby='fieldWithTextAreaInfo' />
			</FieldRow>
			<FieldError>Error feedback</FieldError>
			<FieldRow>
				<FieldHint>Hint</FieldHint>
				<FieldLink href='#'>Link</FieldLink>
			</FieldRow>
		</Field>
	),
};

export const WithRadioButton: Story = {
	render: () => (
		<Field>
			<FieldRow>
				<FieldLabel required htmlFor='fieldWithRadio'>
					Label
					<FieldLabelInfo id='fieldWithRadioInfo' title='this is a info label' />
				</FieldLabel>
				<RadioButton id='fieldWithRadio' aria-describedby='fieldWithRadioInfo' />
			</FieldRow>
			<FieldDescription>Description</FieldDescription>
			<FieldError>Error feedback</FieldError>
			<FieldRow>
				<FieldHint>Hint</FieldHint>
				<FieldLink href='#'>Link</FieldLink>
			</FieldRow>
		</Field>
	),
};

export const WithToggleSwitch: Story = {
	render: () => (
		<Field>
			<FieldRow>
				<FieldLabel required htmlFor='fieldWithToggle'>
					Label
					<FieldLabelInfo id='fieldWithToggleInfo' title='this is a info label' />
				</FieldLabel>
				<ToggleSwitch id='fieldWithToggle' aria-describedby='fieldWithToggleInfo' />
			</FieldRow>
			<FieldDescription>Description</FieldDescription>
			<FieldError>Error feedback</FieldError>
			<FieldRow>
				<FieldHint>Hint</FieldHint>
				<FieldLink href='#'>Link</FieldLink>
			</FieldRow>
		</Field>
	),
};

export const WithCheckbox: Story = {
	render: () => (
		<Field>
			<FieldRow>
				<FieldLabel required htmlFor='fieldWithCheckbox'>
					Label
					<FieldLabelInfo id='fieldWithCheckboxInfo' title='this is a info label' />
				</FieldLabel>
				<CheckBox id='fieldWithCheckbox' aria-describedby='fieldWithCheckboxInfo' />
			</FieldRow>
			<FieldDescription>Description</FieldDescription>
			<FieldError>Error feedback</FieldError>
			<FieldRow>
				<FieldHint>Hint</FieldHint>
				<FieldLink href='#'>Link</FieldLink>
			</FieldRow>
		</Field>
	),
};

export const WithLinkAtTheEnd: Story = {
	render: () => (
		<Field>
			<FieldLabel htmlFor='fieldWithLinkAtTheEnd'>Password</FieldLabel>
			<FieldRow>
				<PasswordInput id='fieldWithLinkAtTheEnd' />
			</FieldRow>
			<FieldRow justify='end'>
				<FieldLink href='#'>Forgot your password?</FieldLink>
			</FieldRow>
		</Field>
	),
};
