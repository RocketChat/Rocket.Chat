import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Key } from 'react';
import { useState } from 'react';

import Select from './Select';
import type { SelectOption } from './SelectLegacy';
import { PropsVariationSection, variationPseudoStates } from '../../../.storybook/helpers';

const options: SelectOption[] = Array.from({
	length: 12,
}).map((_, i) => [`${i + 1}`, `a test ${i + 1}`]);

export default {
	title: 'Inputs/Select',
	component: Select,
	argTypes: {
		options: {
			control: false,
			description: 'The full list of selectable options as `[value, label]` tuples rendered as items.',
			table: { category: 'Content' },
		},
		placeholder: {
			control: 'text',
			description: 'Text shown in the trigger when no option is selected.',
			table: { category: 'Content' },
		},
		value: {
			control: false,
			description: 'Controlled key of the currently selected option.',
			table: { category: 'Selection' },
		},
		onChange: {
			control: false,
			description: 'Called with the newly selected option key.',
			table: { category: 'Selection' },
		},
		error: {
			control: 'text',
			description: 'Displays the invalid style and error state on the select trigger.',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			description: 'Disables the select and blocks interaction.',
			table: { category: 'State' },
		},
		small: {
			control: 'boolean',
			description: 'Renders the select trigger at a smaller size scale.',
			table: { category: 'Size' },
		},
	},
} satisfies Meta<typeof Select>;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
	args: {
		'placeholder': 'Placeholder here...',
		options,
		'aria-label': 'Select',
	},
};

export const Controlled: Story = {
	args: {
		'aria-label': 'Controlled select',
		options,
	},
	render: (args) => {
		const [value, setValue] = useState<Key>('3');

		return <Select {...args} value={value} onChange={setValue} />;
	},
};

export const Error: Story = {
	args: {
		'aria-label': 'Error select',
		'error': 'Error',
		'placeholder': 'Placeholder here...',
		options,
	},
};

export const Disabled: Story = {
	args: {
		'aria-label': 'Disabled select',
		'disabled': true,
		'placeholder': 'Placeholder here...',
		options,
	},
};

export const NoPlaceholder: Story = {
	args: {
		'aria-label': 'No placeholder select',
		options,
	},
};

export const States: Story = {
	parameters: { pseudo: variationPseudoStates },
	render: () => (
		<>
			<PropsVariationSection
				component={(props) => <Select options={options} aria-label='select' {...props} />}
				common={{
					onChange: () => {},
				}}
				xAxis={{
					'default': {},
					'with placeholder': { placeholder: 'Placeholder' },
					'small': { small: true },
					'small with placeholder': { small: true, placeholder: 'Placeholder' },
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
		</>
	),
};
