import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { action } from 'storybook/actions';

import Pagination from './Pagination';

export default {
	title: 'Navigation/Pagination',
	component: Pagination,
	parameters: {
		docs: {
			description: {
				component:
					'Splits data into several pages, with navigation control and items-per-page. Usually used with tables.\n\n' +
					'**Rules**\n' +
					'- Use with paginated data sets, typically below a table.',
			},
		},
	},
	argTypes: {
		count: {
			control: 'number',
			description: 'Total number of items being paginated; used to compute the number of pages and the results label.',
			table: { category: 'Content' },
		},
		current: {
			control: 'number',
			description: 'Zero-based index of the first item shown on the current page.',
			table: { category: 'Content' },
		},
		itemsPerPage: {
			control: 'select',
			options: [25, 50, 100],
			description: 'Number of items rendered per page.',
			table: { category: 'Content' },
		},
		itemsPerPageLabel: {
			control: false,
			description: 'Renders the "Items per page:" label; called with `{ count, current, itemsPerPage }`.',
			table: { category: 'Content' },
		},
		showingResultsLabel: {
			control: false,
			description: 'Renders the "Showing results X - Y of Z" label; called with `{ count, current, itemsPerPage }`.',
			table: { category: 'Content' },
		},
		divider: {
			control: 'boolean',
			description: 'Adds a divider between the items-per-page section and the results/page-links section.',
			table: { category: 'Style' },
		},
		onSetCurrent: {
			control: false,
			description: 'Called with the new `current` index when a page, previous, or next link is clicked.',
			table: { category: 'Events' },
		},
		onSetItemsPerPage: {
			control: false,
			description: 'Called with the newly chosen items-per-page value when an items-per-page option is clicked.',
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
