import type { Meta, StoryObj } from '@storybook/react-webpack5';

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
			description: {
				component:
					'Wraps an input with the supporting copy elements (label, description, hint, link, error) and keeps that copy clear, concise and consistent.\n\n' +
					'**Rules**\n' +
					'- Label — accurately describe the information needed; mark required fields with an asterisk.\n' +
					'- Description — context/instructions that clarify the label; keep it clear and simple.\n' +
					"- Placeholder — only when an extra hint helps the user, since it disappears on input; don't repeat the label in the placeholder.\n" +
					'- Error message — explain the problem and give an actionable fix (e.g. "Invalid email address"); avoid vague or apologetic copy.\n' +
					'- Hint — explain technical terms or behaviors.\n' +
					'- There is no dedicated Select/Dropdown component — a select is composed from a text Field whose input shows a chevron-down as its trailing icon.',
			},
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
