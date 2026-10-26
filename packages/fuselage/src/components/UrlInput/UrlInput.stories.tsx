import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { PropsVariationSection, variationPseudoStates } from '../../../.storybook/helpers';
import { Icon } from '../Icon';
import UrlInput from './UrlInput';

export default {
	title: 'Inputs/UrlInput',
	component: UrlInput,
	argTypes: {
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
	parameters: { pseudo: variationPseudoStates },
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
