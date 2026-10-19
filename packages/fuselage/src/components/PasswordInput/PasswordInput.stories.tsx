import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { PropsVariationSection } from '../../../.storybook/helpers';
import { Icon } from '../Icon';
import PasswordInput from './PasswordInput';

export default {
	title: 'Inputs/PasswordInput',
	component: PasswordInput,
	argTypes: {
		startAddon: {
			control: false,
			description: 'Content rendered before the input, inside its border.',
			table: { category: 'Content' },
		},
		endAddon: {
			control: false,
			description: 'Content rendered after the input, inside its border; overrides the default show/hide password icon.',
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
};

export const WithIconAddon: Story = {
	args: {
		'aria-label': 'password',
		'endAddon': <Icon name='send' size={20} />,
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
					'hover': { className: 'hover' },
					'active': { className: 'active' },
					'focus': { className: 'focus' },
					'disabled': { disabled: true },
					'errored': { error: 'Error' },
					'errored + hover': { className: 'hover', error: 'Error' },
					'errored + active': { className: 'active', error: 'Error' },
					'errored + focus': { className: 'focus', error: 'Error' },
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
					'hover': { className: 'hover' },
					'active': { className: 'active' },
					'focus': { className: 'focus' },
					'disabled': { disabled: true },
					'errored': { error: 'Error' },
					'errored + hover': { className: 'hover', error: 'Error' },
					'errored + active': { className: 'active', error: 'Error' },
					'errored + focus': { className: 'focus', error: 'Error' },
				}}
			/>
		</>
	),
};
