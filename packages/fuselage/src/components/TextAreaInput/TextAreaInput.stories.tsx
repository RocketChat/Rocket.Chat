import type { Meta, StoryObj } from '@storybook/react-vite';

import { PropsVariationSection, variationPseudoStates } from '../../../.storybook/helpers';
import { Icon } from '../Icon';
import TextAreaInput from './TextAreaInput';

export default {
	title: 'Inputs/TextAreaInput',
	component: TextAreaInput,
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
			description: 'Placeholder text shown when the textarea is empty.',
			table: { category: 'Content' },
		},
		small: {
			control: 'boolean',
			description: 'Renders the textarea at a smaller size scale.',
			table: { category: 'Size' },
		},
		error: {
			control: 'text',
			description: 'Error message that marks the textarea as invalid and styles it accordingly.',
			table: { category: 'State' },
		},
		placeholderVisible: {
			control: 'boolean',
			description: 'Keeps the placeholder visible even when there is a value.',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			description: 'Disables the textarea and blocks pointer interaction.',
			table: { category: 'State' },
		},
		value: {
			control: 'text',
			description: 'Controlled value of the textarea.',
			table: { category: 'Content' },
		},
		defaultValue: {
			control: 'text',
			description: 'Initial, uncontrolled value of the textarea.',
			table: { category: 'Content' },
		},
		onChange: {
			control: false,
			description: 'Called when the textarea value changes.',
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
	parameters: { pseudo: variationPseudoStates },
	render: () => (
		<PropsVariationSection
			component={TextAreaInput}
			common={{ onChange: () => {} }}
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
