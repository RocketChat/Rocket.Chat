import type { Meta, StoryObj } from '@storybook/react';

import { PropsVariationSection, variationPseudoStates } from '../../../.storybook/helpers';
import { Icon } from '../Icon';
import NumberInput from './NumberInput';

export default {
	title: 'Inputs/NumberInput',
	component: NumberInput,
	parameters: {
		docs: {
			usage: `
- Follows the \`TextInput\` usage.
`,
		},
	},
	args: {
		'aria-label': 'number',
	},
	argTypes: {
		value: {
			control: 'number',
			table: { category: 'Content' },
		},
		defaultValue: {
			control: 'number',
			table: { category: 'Content' },
		},
		placeholder: {
			control: 'text',
			table: { category: 'Content' },
		},
		placeholderVisible: {
			control: 'boolean',
			description: "Shows the value in the placeholder's color.",
			table: { category: 'Content' },
		},
		small: {
			control: 'boolean',
			description: 'Shrinks the input to 28 pixels high, with smaller text.',
			table: { category: 'Size' },
		},
		disabled: {
			control: 'boolean',
			table: { category: 'State' },
		},
		error: {
			control: 'text',
			description:
				"Marks the input as invalid, with this text as its native validation message. The input doesn't display it: show it in a `FieldError`.",
			table: { category: 'State' },
		},
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
		onChange: {
			control: false,
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof NumberInput>;

type Story = StoryObj<typeof NumberInput>;

export const Default: Story = {};

export const WithIconAddon: Story = {
	args: {
		endAddon: <Icon name='send' size='x20' />,
	},
};

export const Invalid: Story = {
	args: {
		error: 'Error',
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
};

export const WithPlaceholder: Story = {
	args: {
		defaultValue: 1024,
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
				component={NumberInput}
				common={{ 'onChange': () => undefined, 'aria-label': 'number' }}
				xAxis={{
					'default': {},
					'with placeholder': { placeholder: 'Placeholder' },
					'with value': { value: 1024 },
					'with icon': {
						endAddon: <Icon name='discover' size='x20' />,
						value: 1024,
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
				component={NumberInput}
				common={{ 'onChange': () => undefined, 'small': true, 'aria-label': 'number' }}
				xAxis={{
					'small': {},
					'with placeholder': { placeholder: 'Placeholder' },
					'with value': { value: 1024 },
					'with icon': {
						endAddon: <Icon name='discover' size='x20' />,
						value: 1024,
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
