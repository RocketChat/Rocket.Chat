import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { PropsVariationSection, variationPseudoStates } from '../../../.storybook/helpers';
import { Icon } from '../Icon';
import EmailInput from './EmailInput';

export default {
	title: 'Inputs/EmailInput',
	component: EmailInput,
	argTypes: {
		startAddon: {
			control: false,
			description: 'Content rendered before the input, inside its border.',
			table: { category: 'Content' },
		},
		endAddon: {
			control: false,
			description: 'Content rendered after the input, inside its border.',
			table: { category: 'Content' },
		},
		placeholder: {
			control: 'text',
			description: 'Placeholder text shown when the input is empty.',
			table: { category: 'Content' },
		},
		small: {
			control: 'boolean',
			description: 'Renders the input at a smaller size scale.',
			table: { category: 'Size' },
		},
		error: {
			control: 'text',
			description: 'Error message that marks the input as invalid and styles it accordingly.',
			table: { category: 'State' },
		},
		placeholderVisible: {
			control: 'boolean',
			description: 'Keeps the placeholder visible even when there is a value.',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			description: 'Disables the input and blocks pointer interaction.',
			table: { category: 'State' },
		},
		value: {
			control: 'text',
			description: 'Controlled value of the input.',
			table: { category: 'Content' },
		},
		defaultValue: {
			control: 'text',
			description: 'Initial, uncontrolled value of the input.',
			table: { category: 'Content' },
		},
		onChange: {
			control: false,
			description: 'Called when the input value changes.',
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof EmailInput>;

type Story = StoryObj<typeof EmailInput>;

export const Default: Story = {
	args: {
		'aria-label': 'email',
	},
};

export const WithIconAddon: Story = {
	args: {
		'aria-label': 'email',
		'endAddon': <Icon name='send' size='x20' />,
	},
};

export const Invalid: Story = {
	args: {
		'aria-label': 'email',
		'error': 'Error',
	},
};

export const Disabled: Story = {
	args: {
		'aria-label': 'email',
		'disabled': true,
	},
};

export const WithPlaceholder: Story = {
	args: {
		'aria-label': 'email',
		'placeholder': 'Placeholder',
	},
};

export const WithValue: Story = {
	args: {
		'aria-label': 'email',
		'defaultValue': 'support@rocket.chat',
	},
};

export const States: Story = {
	parameters: { pseudo: variationPseudoStates },
	render: () => (
		<>
			<PropsVariationSection
				component={EmailInput}
				common={{ 'onChange': () => {}, 'aria-label': 'email' }}
				xAxis={{
					'default': {},
					'with placeholder': { placeholder: 'Placeholder' },
					'with value': { value: 'support@rocket.chat' },
					'with icon': {
						endAddon: <Icon name='at' size='x20' />,
						value: 'support@rocket.chat',
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
				component={EmailInput}
				common={{ 'onChange': () => {}, 'small': true, 'aria-label': 'email' }}
				xAxis={{
					'small': {},
					'with placeholder': { placeholder: 'Placeholder' },
					'with value': { value: 'support@rocket.chat' },
					'with icon': {
						endAddon: <Icon name='at' size='x20' />,
						value: 'support@rocket.chat',
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
