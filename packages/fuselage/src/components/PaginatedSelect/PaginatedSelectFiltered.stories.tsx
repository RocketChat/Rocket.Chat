import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Option, OptionDescription } from '../Option';
import PaginatedSelectFiltered from './PaginatedSelectFiltered';

export default {
	title: 'Inputs/PaginatedSelectFiltered',
	component: PaginatedSelectFiltered,
	args: {
		placeholder: 'Placeholder here...',
		options: Array.from({ length: 1000 }, (_, i) => ({
			value: i,
			label: `Item #${i}`,
		})),
		style: { width: '250px' },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'centered',
	},
	argTypes: {
		options: {
			control: false,
			description: 'List of `{ value, label }` options rendered in the paginated dropdown list.',
			table: { category: 'Content' },
		},
		value: {
			control: false,
			description: 'Currently selected value; must match the `value` of one of the `options`.',
			table: { category: 'State' },
		},
		placeholder: {
			control: 'text',
			description: 'Placeholder text shown in the filter input when no filter text has been typed.',
			table: { category: 'Content' },
		},
		withTitle: {
			control: 'boolean',
			description: 'Sets the `title` attribute on the rendered options, used to show the full label on hover when truncated.',
			table: { category: 'Content' },
		},
		filter: {
			control: 'text',
			description: 'Current filter text used to narrow down the list of options shown in the dropdown.',
			table: { category: 'State' },
		},
		setFilter: {
			control: false,
			description: 'Called with the new text whenever the user types into the filter input.',
			table: { category: 'Events' },
		},
		error: {
			control: 'text',
			description: 'Error message; when set, the field is rendered with the invalid style state.',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			description: 'Disables the field and blocks pointer interaction.',
			table: { category: 'State' },
		},
		onChange: {
			control: false,
			description: 'Called with the newly selected option value when an item is chosen from the list.',
			table: { category: 'Events' },
		},
		endReached: {
			control: false,
			description:
				'Called with the current option index when the dropdown list is scrolled near its end, used to fetch more paginated options.',
			table: { category: 'Events' },
		},
		anchor: {
			control: false,
			description:
				'Overrides the trigger element rendered inside the field (defaults to `SelectFocus`); `PaginatedSelectFiltered` replaces it internally with a filter `Input`.',
			table: { category: 'Content' },
		},
		renderOptions: {
			control: false,
			description: 'Overrides the component that renders the dropdown list of options (defaults to `OptionsPaginated`).',
			table: { category: 'Content' },
		},
		renderItem: {
			control: false,
			description:
				'Overrides the component used to render each option row (defaults to `Option`); used by the `WithRenderItem` story to show extra option details.',
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof PaginatedSelectFiltered>;

type Story = StoryObj<typeof PaginatedSelectFiltered>;

export const Normal: Story = {};

export const Errored: Story = {
	args: {
		error: 'Error',
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
};

export const WithRenderItem: Story = {
	args: {
		renderItem: ({ label, value, index, ...props }) => (
			<Option {...props} label={<strong>{label}</strong>}>
				<OptionDescription>
					(Value: {value}, Index: {index})
				</OptionDescription>
			</Option>
		),
	},
};
