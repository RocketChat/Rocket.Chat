import type { Meta, StoryObj } from '@storybook/react';

import { PropsVariationSection, variationPseudoStates } from '../../../.storybook/helpers';
import { Icon } from '../Icon';
import UrlInput from './UrlInput';

export default {
	title: 'Inputs/UrlInput',
	component: UrlInput,
	parameters: {
		docs: {
			usage: `
- Follows the \`TextInput\` usage.
`,
		},
	},
	argTypes: {
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
} satisfies Meta<typeof UrlInput>;

type Story = StoryObj<typeof UrlInput>;

export const Default: Story = {
	args: {
		'aria-label': 'url',
	},
};

export const WithIconAddon: Story = {
	args: {
		'aria-label': 'url',
		'endAddon': <Icon name='send' size='x20' />,
	},
};

export const Invalid: Story = {
	args: {
		'aria-label': 'url',
		'error': 'Error',
	},
};

export const Disabled: Story = {
	args: {
		'aria-label': 'url',
		'disabled': true,
	},
};

export const WithPlaceholder: Story = {
	args: {
		'aria-label': 'url',
		'placeholder': 'Placeholder',
	},
};

export const WithValue: Story = {
	args: {
		'aria-label': 'url',
		'defaultValue': 'https://rocket.chat',
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
				component={UrlInput}
				common={{ 'onChange': () => undefined, 'aria-label': 'url' }}
				xAxis={{
					'default': {},
					'with placeholder': { placeholder: 'Placeholder' },
					'with value': { value: 'https://rocket.chat' },
					'with icon': {
						endAddon: <Icon name='discover' size='x20' />,
						value: 'https://rocket.chat',
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
				component={UrlInput}
				common={{
					'onChange': () => undefined,
					'small': true,
					'aria-label': 'url',
				}}
				xAxis={{
					'small': {},
					'with placeholder': { placeholder: 'Placeholder' },
					'with value': { value: 'https://rocket.chat' },
					'with icon': {
						endAddon: <Icon name='discover' size='x20' />,
						value: 'https://rocket.chat',
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
