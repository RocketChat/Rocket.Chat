import type { Meta, StoryObj } from '@storybook/react';

import ListRow from './ListRow';

const meta = {
	component: ListRow,
	decorators: [
		(Story) => (
			<div role='list' aria-label='Items'>
				<Story />
			</div>
		),
	],
	args: {
		children: 'A row read as one item of the list',
	},
} satisfies Meta<typeof ListRow>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
