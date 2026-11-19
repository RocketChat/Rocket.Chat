import type { Meta, StoryObj } from '@storybook/react';
import { useArgs } from 'storybook/preview-api';

import PaginatedMultiSelectFiltered from './PaginatedMultiSelectFiltered';

export default {
	title: 'Inputs/PaginatedMultiSelectFiltered',
	component: PaginatedMultiSelectFiltered,
	args: {
		placeholder: 'Placeholder here...',
		options: Array.from({ length: 1000 }, (_, i) => ({
			value: i,
			label: `Item #${i}`,
		})),
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
			table: { category: 'Content' },
		},
		filter: {
			control: 'text',
			table: { category: 'State' },
		},
		setFilter: {
			control: false,
			table: { category: 'Events' },
		},
		error: {
			control: 'boolean',
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
			table: { category: 'Events' },
		},
		anchor: {
			control: false,
			table: { category: 'Content' },
		},
		renderOptions: {
			control: false,
			table: { category: 'Content' },
		},
		renderItem: {
			control: false,
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof PaginatedMultiSelectFiltered>;

type Story = StoryObj<typeof PaginatedMultiSelectFiltered>;

export const Normal: Story = {
	render: (args) => {
		const [, updateArgs] = useArgs();

		return <PaginatedMultiSelectFiltered setFilter={(filter) => updateArgs({ filter })} {...args} />;
	},
};

export const Errored: Story = {
	args: {
		error: true,
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
};
