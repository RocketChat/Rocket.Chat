import type { Meta, StoryObj } from '@storybook/react';

import { PropsVariationSection, variationPseudoStates } from '../../../.storybook/helpers';
import { Icon } from '../Icon';
import TextAreaInput from './TextAreaInput';

export default {
	title: 'Inputs/TextAreaInput',
	component: TextAreaInput,
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
} satisfies Meta<typeof TextAreaInput>;

type Story = StoryObj<typeof TextAreaInput>;

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
		placeholder: 'Placeholder',
	},
};

export const WithValue: Story = {
	args: {
		defaultValue: 'Roses are red\nViolets are blue',
	},
};

export const States: Story = {
	parameters: {
		pseudo: variationPseudoStates,
		docs: {
			description: {
				story: 'Each interaction state against what the input holds.',
			},
		},
	},
	render: () => (
		<PropsVariationSection
			component={TextAreaInput}
			common={{ onChange: () => undefined }}
			xAxis={{
				'default': {},
				'with placeholder': { placeholder: 'Placeholder' },
				'with value': { value: 'Value' },
				'with icon': {
					endAddon: <Icon name='edit' size='x20' />,
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
	),
};
