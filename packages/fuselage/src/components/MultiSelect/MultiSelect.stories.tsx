import type { Meta, StoryObj } from '@storybook/react-webpack5';
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
			description:
				'The full list of selectable options as `[value, label, selected?]` tuples; drives what is rendered and matched against `value`/`filter`.',
			table: { category: 'Content' },
		},
		placeholder: {
			control: 'text',
			description: 'Text shown in the input when no options are selected.',
			table: { category: 'Content' },
		},
		customEmpty: {
			control: 'text',
			description: 'Message rendered in the options list when there are no options to show.',
			table: { category: 'Content' },
		},
		addonIcon: {
			control: 'text',
			description:
				"Name of the icon shown in the trailing addon when the list is closed; defaults to 'chevron-down' (or 'chevron-up' while open).",
			table: { category: 'Content' },
		},
		value: {
			control: false,
			description:
				"Controlled array of selected option values; when provided, syncs the component's internal selection state via an effect.",
			table: { category: 'Selection' },
		},
		onChange: {
			control: false,
			description: 'Called with the updated array of selected values whenever an option is toggled.',
			table: { category: 'Selection' },
		},
		getLabel: {
			control: false,
			description: "Extracts the display label from an option tuple; defaults to the tuple's second element.",
			table: { category: 'Selection' },
		},
		getValue: {
			control: false,
			description: "Extracts the value from an option tuple; defaults to the tuple's first element.",
			table: { category: 'Selection' },
		},
		error: {
			control: 'text',
			description: 'Displays the invalid style and error state on the input container.',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			description: 'Disables the input and blocks interaction, applying the disabled style.',
			table: { category: 'State' },
		},
		filter: {
			control: 'text',
			description: 'Current filter text; options are matched against it (case-insensitive) to compute the visible list.',
			table: { category: 'Filtering' },
		},
		setFilter: {
			control: false,
			description: 'Called with the new filter text as the user types; used to drive external filtering of `options`.',
			table: { category: 'Filtering' },
		},
		anchor: {
			control: false,
			description: "Component rendered as the clickable input/trigger area; defaults to 'MultiSelectAnchor'.",
			table: { category: 'Customization' },
		},
		renderOptions: {
			control: false,
			description: "Component used to render the options list/popup; defaults to 'Options'.",
			table: { category: 'Customization' },
		},
		renderItem: {
			control: false,
			description: "Component used to render each option row; defaults to 'CheckOption'.",
			table: { category: 'Customization' },
		},
		renderSelected: {
			control: false,
			description: "Component used to render each selected chip instead of the default 'SelectedOptions'.",
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
	render: () => <MultiSelectFiltered placeholder='Placeholder here...' onChange={action('change')} options={options} />,
};
