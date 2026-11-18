import type { Meta, StoryObj } from '@storybook/react';
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
			table: { category: 'Content' },
		},
		placeholder: {
			control: 'text',
			table: { category: 'Content' },
		},
		value: {
			control: false,
			table: { category: 'Selection' },
		},
		onChange: {
			control: false,
			table: { category: 'Selection' },
		},
		error: {
			control: 'text',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			table: { category: 'State' },
		},
		small: {
			control: 'boolean',
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
	parameters: {
		docs: {
			description: {
				story: 'Open the list with a click, the arrow keys, Enter or Space, and type the start of a label to jump to its option.',
			},
		},
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
	parameters: {
		pseudo: variationPseudoStates,
		docs: {
			description: {
				story: 'Each interaction state, with and without a placeholder, at the default size and at `small`.',
			},
		},
	},
	render: () => (
		<>
			<PropsVariationSection
				component={(props) => <Select options={options} aria-label='select' {...props} />}
				common={{
					onChange: () => undefined,
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
