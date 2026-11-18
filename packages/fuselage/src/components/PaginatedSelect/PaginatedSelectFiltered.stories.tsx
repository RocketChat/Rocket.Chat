import type { Meta, StoryObj } from '@storybook/react';

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
			table: { category: 'Content' },
		},
		value: {
			control: false,
			table: { category: 'State' },
		},
		placeholder: {
			control: 'text',
			table: { category: 'Content' },
		},
		withTitle: {
			control: 'boolean',
			description: "Sets each option's label as its `title`, so a label cut short can be read in full on hover.",
			table: { category: 'Content' },
		},
		filter: {
			control: 'text',
			description: "The text typed into the filter input. The options aren't narrowed down by it: pass only the matching ones.",
			table: { category: 'State' },
		},
		setFilter: {
			control: false,
			table: { category: 'Events' },
		},
		error: {
			control: 'text',
			description:
				"Shows the select as invalid; set `aria-invalid` too, for assistive technology. The message isn't shown: show it in a `FieldError`.",
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			table: { category: 'State' },
		},
		onChange: {
			control: false,
			table: { category: 'Events' },
		},
		endReached: {
			control: false,
			description: 'Called when the list is scrolled to its end, to load the next page of `options`.',
			table: { category: 'Events' },
		},
		anchor: {
			control: false,
			description: 'Not used: the filter input always takes its place.',
			table: { category: 'Content' },
		},
		renderOptions: {
			control: false,
			description: 'Replaces the list of options.',
			table: { category: 'Content' },
		},
		renderItem: {
			control: false,
			description: 'Renders each option in the list.',
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
