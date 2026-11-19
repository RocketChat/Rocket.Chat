import type { Meta, StoryObj } from '@storybook/react';

import { PropsVariationSection, variationPseudoStates } from '../../../.storybook/helpers';
import { Icon } from '../Icon';
import TextInput from './TextInput';

export default {
	title: 'Inputs/TextInput',
	component: TextInput,
	parameters: {
		docs: {
			usage: `
- Compose the input in a \`Field\`, with the \`FieldLabel\`, \`FieldDescription\`, \`FieldHint\`, \`FieldLink\` and \`FieldError\` it needs around it.
- Give it a \`FieldLabel\` unless the surrounding interface already makes clear what to type in it.
- Add a \`FieldLabelInfo\` to the label when the input asks for a complex concept that needs more explanation.
- Use the \`FieldDescription\` for what the input requires, in plain text.
- Use a \`FieldHint\` to explain technical terms, and a \`FieldLink\` to point to documentation or other resources; put both in the same \`FieldRow\`, which sets them at opposite ends.
- When the value is invalid, set \`error\` and show a \`FieldError\` that says what is wrong and how to fix it.
- Word the label, description, hint and error as the \`Field\` usage says.
`,
		},
	},
	argTypes: {
		startAddon: {
			control: false,
			description: "Content inside the input's border, before the value, such as an icon.",
			table: { category: 'Content' },
		},
		endAddon: {
			control: false,
			description: "Content inside the input's border, after the value, such as an icon or a small button.",
			table: { category: 'Content' },
		},
		placeholder: {
			control: 'text',
			table: { category: 'Content' },
		},
		small: {
			control: 'boolean',
			description: 'Shrinks the input to 28 pixels high, with smaller text.',
			table: { category: 'Size' },
		},
		error: {
			control: 'text',
			description:
				"Marks the input as invalid, with this text as its native validation message. The input doesn't display it: show it in a `FieldError`.",
			table: { category: 'State' },
		},
		placeholderVisible: {
			control: 'boolean',
			description: "Shows the value in the placeholder's color.",
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			table: { category: 'State' },
		},
		value: {
			control: 'text',
			table: { category: 'Content' },
		},
		defaultValue: {
			control: 'text',
			table: { category: 'Content' },
		},
		onChange: {
			control: false,
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof TextInput>;

type Story = StoryObj<typeof TextInput>;

export const Default: Story = {
	args: {
		'aria-label': 'text',
	},
};

export const WithIconAddon: Story = {
	args: {
		'aria-label': 'text',
		'endAddon': <Icon name='send' size='x20' />,
	},
};

export const Invalid: Story = {
	args: {
		'aria-label': 'text',
		'error': 'Error',
	},
};

export const Disabled: Story = {
	args: {
		'aria-label': 'text',
		'disabled': true,
	},
};

export const WithPlaceholder: Story = {
	args: {
		'aria-label': 'text',
		'placeholder': 'Placeholder',
	},
};

export const WithValue: Story = {
	args: {
		'aria-label': 'text',
		'defaultValue': 'Value',
	},
};

export const States: Story = {
	parameters: {
		pseudo: variationPseudoStates,
		docs: {
			description: {
				story: 'Each interaction state against what the input holds, at the default size and at `small`.',
			},
		},
	},
	render: () => (
		<>
			<PropsVariationSection
				component={TextInput}
				common={{ 'onChange': () => undefined, 'aria-label': 'text' }}
				xAxis={{
					'default': {},
					'with placeholder': { placeholder: 'Placeholder' },
					'with value': { value: 'Value' },
					'with icon': {
						endAddon: <Icon name='keyboard' size='x20' />,
						value: 'Value',
					},
				}}
				yAxis={{
					'default': {},
					'hover': {},
					'active': {},
					'focus': {},
					'disabled': { disabled: true },
					'errored': { error: 'Error' },
					'errored + hover': { error: 'Error' },
					'errored + active': { error: 'Error' },
					'errored + focus': { error: 'Error' },
				}}
			/>
			<PropsVariationSection
				component={TextInput}
				common={{ 'onChange': () => undefined, 'small': true, 'aria-label': 'text' }}
				xAxis={{
					'small': {},
					'with placeholder': { placeholder: 'Placeholder' },
					'with value': { value: 'Value' },
					'with icon': {
						endAddon: <Icon name='keyboard' size='x20' />,
						value: 'Value',
					},
				}}
				yAxis={{
					'small': {},
					'hover': {},
					'active': {},
					'focus': {},
					'disabled': { disabled: true },
					'errored': { error: 'Error' },
					'errored + hover': { error: 'Error' },
					'errored + active': { error: 'Error' },
					'errored + focus': { error: 'Error' },
				}}
			/>
		</>
	),
};
