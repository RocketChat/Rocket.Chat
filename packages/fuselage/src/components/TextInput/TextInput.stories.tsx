import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { PropsVariationSection } from '../../../.storybook/helpers';
import { Icon } from '../Icon';
import TextInput from './TextInput';

export default {
	title: 'Inputs/TextInput',
	component: TextInput,
	parameters: {
		docs: {
			description: {
				component:
					'Lets users input one or multiple string values.\n\n' +
					'**Rules**\n' +
					'- Compose text inputs through the Field wrapper to get consistent label/description/hint/error/link.\n' +
					'- Follow the Field UX-writing rules for all copy (clear labels, actionable error messages, hints for technical terms).',
			},
		},
	},
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
	render: () => (
		<>
			<PropsVariationSection
				component={TextInput}
				common={{ 'onChange': () => {}, 'aria-label': 'text' }}
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
				component={TextInput}
				common={{ 'onChange': () => {}, 'small': true, 'aria-label': 'text' }}
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
