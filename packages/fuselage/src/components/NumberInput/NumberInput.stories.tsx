import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { PropsVariationSection } from '../../../.storybook/helpers';
import { Icon } from '../Icon';
import NumberInput from './NumberInput';

export default {
	title: 'Inputs/NumberInput',
	component: NumberInput,
	args: {
		'aria-label': 'number',
	},
	argTypes: {
		value: {
			control: 'number',
			description: 'Current value of the underlying number input, for controlled usage.',
			table: { category: 'Content' },
		},
		defaultValue: {
			control: 'number',
			description: 'Initial value of the underlying number input, for uncontrolled usage.',
			table: { category: 'Content' },
		},
		placeholder: {
			control: 'text',
			description: 'Placeholder text shown by the native input when it has no value.',
			table: { category: 'Content' },
		},
		placeholderVisible: {
			control: 'boolean',
			description: 'Forces the `rcx-input-box--placeholder-visible` state, keeping the placeholder visible.',
			table: { category: 'Content' },
		},
		small: {
			control: 'boolean',
			description: 'Renders the input at a smaller size.',
			table: { category: 'Size' },
		},
		disabled: {
			control: 'boolean',
			description: 'Disables the input and blocks interaction.',
			table: { category: 'State' },
		},
		error: {
			control: 'text',
			description: 'Error message; when set, marks the input as invalid via `setCustomValidity` and shows the invalid state styling.',
			table: { category: 'State' },
		},
		startAddon: {
			control: false,
			description: 'Content rendered before the input, inside the decorated wrapper.',
			table: { category: 'Content' },
		},
		endAddon: {
			control: false,
			description: 'Content rendered after the input, inside the decorated wrapper.',
			table: { category: 'Content' },
		},
		onChange: {
			control: false,
			description: 'Called when the value changes; also re-evaluates addon validity styling.',
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
