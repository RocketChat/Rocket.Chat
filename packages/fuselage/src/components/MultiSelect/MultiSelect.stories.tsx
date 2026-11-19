import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import type { SelectOption } from '../Select';
import MultiSelect from './MultiSelect';
import MultiSelectFiltered from './MultiSelectFiltered';

export default {
	title: 'Inputs/MultiSelect',
	component: MultiSelect,
	subcomponents: {
		MultiSelectFiltered,
	},
	argTypes: {
		options: {
			control: false,
			table: { category: 'Content' },
		},
		placeholder: {
			control: 'text',
			table: { category: 'Content' },
		},
		customEmpty: {
			control: 'text',
			table: { category: 'Content' },
		},
		addonIcon: {
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
		getLabel: {
			control: false,
			table: { category: 'Selection' },
		},
		getValue: {
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
		filter: {
			control: 'text',
			table: { category: 'Filtering' },
		},
		setFilter: {
			control: false,
			table: { category: 'Filtering' },
		},
		anchor: {
			control: false,
			table: { category: 'Customization' },
		},
		renderOptions: {
			control: false,
			table: { category: 'Customization' },
		},
		renderItem: {
			control: false,
			table: { category: 'Customization' },
		},
		renderSelected: {
			control: false,
			table: { category: 'Customization' },
		},
	},
} satisfies Meta<typeof MultiSelect>;

type Story = StoryObj<typeof MultiSelect>;

const options: SelectOption[] = [
	['1', 'a teste 1'],
	['2', 'b teste 2', true],
	['3', 'c teste 3'],
	['4', 'd teste 4'],
	['5', 'd teste 5'],
	['6', 'd teste 6'],
	['7', 'd teste 7'],
	['8', 'd teste 8'],
	['9', 'd teste 9'],
	['10', 'd teste 10'],
];

export const Default: Story = {
	args: {
		'aria-label': 'MultiSelect',
		'placeholder': 'Placeholder here...',
		options,
	},
};

export const WithValue: Story = {
	args: {
		'aria-label': 'MultiSelect',
		'placeholder': 'Placeholder here...',
		options,
		'value': ['1', '2'],
	},
	parameters: {
		docs: {
			description: {
				story: 'Click a chip to deselect its option.',
			},
		},
	},
};

export const Error: Story = {
	args: {
		'aria-label': 'MultiSelect',
		'error': 'Error',
		'placeholder': 'Placeholder here...',
		options,
	},
};

export const Disabled: Story = {
	args: {
		'aria-label': 'MultiSelect',
		'disabled': true,
		'placeholder': 'Placeholder here...',
		options,
	},
};

export const CustomEmpty: Story = {
	args: {
		'aria-label': 'MultiSelect',
		'customEmpty': 'Custom Empty Placeholder',
		'placeholder': 'Placeholder here...',
		'options': [],
	},
};

export const WithFilter: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Type into the select to narrow its options down.',
			},
		},
	},
	render: () => <MultiSelectFiltered placeholder='Placeholder here...' onChange={action('change')} options={options} />,
};
