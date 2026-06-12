import { Box } from '@rocket.chat/fuselage';
import type { StoryObj, Meta } from '@storybook/react';

import Item from './Item';

export default {
	component: Item,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
} satisfies Meta<typeof Item>;

export const Default: StoryObj<typeof Item> = {
	name: 'Item',

	args: {
		data: {
			shortcut: 'test',
			text: 'simple canned response test',
			scope: 'global',
			tags: ['sales', 'support'],
			_createdAt: new Date(),
			_id: 'test',
			_updatedAt: new Date(),
			createdBy: {
				_id: 'rocket.cat',
				username: 'rocket.cat',
			},
			departmentName: '',
			userId: 'rocket.cat',
			departmentId: '',
		},
	},

	decorators: [(fn) => <Box w='330px'>{fn()}</Box>],
};
