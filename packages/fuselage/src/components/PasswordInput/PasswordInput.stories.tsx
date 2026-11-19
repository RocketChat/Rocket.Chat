import type { Meta, StoryObj } from '@storybook/react';

import { PropsVariationSection, variationPseudoStates } from '../../../.storybook/helpers';
import { Icon } from '../Icon';
import PasswordInput from './PasswordInput';

export default {
	title: 'Inputs/PasswordInput',
	component: PasswordInput,
	parameters: {
		docs: {
			usage: `
- Follows the \`TextInput\` usage.
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
			description: "Content inside the input's border, after the value. Replaces the toggle that shows and hides the password.",
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
} satisfies Meta<typeof PasswordInput>;

type Story = StoryObj<typeof PasswordInput>;

export const Default: Story = {
	args: {
		'aria-label': 'password',
	},
};

export const WithValue: Story = {
	args: {
		'aria-label': 'password',
		'defaultValue': 'password',
	},
	parameters: {
		docs: {
			description: {
				story: 'Click the eye icon to show or hide the password.',
			},
		},
	},
};

export const WithIconAddon: Story = {
	args: {
		'aria-label': 'password',
		'endAddon': <Icon name='send' size={20} />,
	},
	parameters: {
		docs: {
			description: {
				story: 'An `endAddon` takes the place of the toggle that shows and hides the password.',
			},
		},
	},
};

export const Invalid: Story = {
	args: {
		'aria-label': 'password',
		'error': 'Error',
	},
};

export const Disabled: Story = {
	args: {
		'aria-label': 'password',
		'disabled': true,
	},
};

export const WithPlaceholder: Story = {
	args: {
		'aria-label': 'password',
		'placeholder': 'Placeholder',
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
				component={PasswordInput}
				common={{ 'onChange': () => undefined, 'aria-label': 'password' }}
				xAxis={{
					'default': {},
					'with placeholder': { placeholder: 'Placeholder' },
					'with value': { value: 'Value' },
					'with icon': {
						endAddon: <Icon name='key' size='x20' />,
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
				component={PasswordInput}
				common={{
					'onChange': () => undefined,
					'small': true,
					'aria-label': 'password',
				}}
				xAxis={{
					'small': {},
					'with placeholder': { placeholder: 'Placeholder' },
					'with value': { value: 'Value' },
					'with icon': {
						endAddon: <Icon name='key' size='x20' />,
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
