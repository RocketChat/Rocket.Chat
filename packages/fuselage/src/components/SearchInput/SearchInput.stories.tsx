import type { Meta, StoryObj } from '@storybook/react-vite';

import { PropsVariationSection, variationPseudoStates } from '../../../.storybook/helpers';
import { Icon } from '../Icon';
import SearchInput from './SearchInput';

export default {
	title: 'Inputs/SearchInput',
	component: SearchInput,
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
} satisfies Meta<typeof SearchInput>;

type Story = StoryObj<typeof SearchInput>;

export const Default: Story = {
	args: {
		'aria-label': 'search',
	},
};

export const WithIconAddon: Story = {
	args: {
		'aria-label': 'search',
		'endAddon': <Icon name='send' size='x20' />,
	},
};

export const Invalid: Story = {
	args: {
		'aria-label': 'search',
		'error': 'Error',
	},
};

export const Disabled: Story = {
	args: {
		'aria-label': 'search',
		'disabled': true,
	},
};

export const WithPlaceholder: Story = {
	args: {
		'aria-label': 'search',
		'placeholder': 'Placeholder',
	},
};

export const WithValue: Story = {
	args: {
		'aria-label': 'search',
		'defaultValue': 'cat rooms',
	},
};

export const States: Story = {
	parameters: { pseudo: variationPseudoStates },
	render: () => (
		<>
			<PropsVariationSection
				component={SearchInput}
				common={{ 'onChange': () => {}, 'aria-label': 'search' }}
				xAxis={{
					'default': {},
					'with placeholder': { placeholder: 'Placeholder' },
					'with value': { value: 'Value' },
					'with icon': {
						endAddon: <Icon name='magnifier' size='x20' />,
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
				component={SearchInput}
				common={{ 'onChange': () => {}, 'small': true, 'aria-label': 'search' }}
				xAxis={{
					'small': {},
					'with placeholder': { placeholder: 'Placeholder' },
					'with value': { value: 'Value' },
					'with icon': {
						endAddon: <Icon name='magnifier' size='x20' />,
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
