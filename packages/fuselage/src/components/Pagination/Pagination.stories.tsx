import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import Pagination from './Pagination';

export default {
	title: 'Navigation/Pagination',
	component: Pagination,
	parameters: {
		docs: {
			usage: `
- Use it with a paginated data set, below the table that shows it.
`,
		},
	},
	argTypes: {
		count: {
			control: 'number',
			table: { category: 'Content' },
		},
		current: {
			control: 'number',
			table: { category: 'Content' },
		},
		itemsPerPage: {
			control: 'select',
			options: [25, 50, 100],
			table: { category: 'Content' },
		},
		itemsPerPageLabel: {
			control: false,
			table: { category: 'Content' },
		},
		showingResultsLabel: {
			control: false,
			table: { category: 'Content' },
		},
		divider: {
			control: 'boolean',
			table: { category: 'Style' },
		},
		onSetCurrent: {
			control: false,
			table: { category: 'Events' },
		},
		onSetItemsPerPage: {
			control: false,
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof Pagination>;

type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
	args: {
		count: 500,
		onSetItemsPerPage: action('setItemsPerPage'),
		onSetCurrent: action('setCurrent'),
	},
};

export const Divider: Story = {
	args: {
		divider: true,
		count: 500,
		current: 50,
		onSetItemsPerPage: action('setItemsPerPage'),
		onSetCurrent: action('setCurrent'),
	},
};
