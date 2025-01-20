import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import Item from './Item';

export default {
	title: 'Enterprise/Omnichannel/Item',
	component: Item,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
} satisfies Meta<typeof Item>;

export const Default: StoryFn<typeof Item> = (args) => <Item {...args} />;
Default.storyName = 'Item';
Default.args = {
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
};
Default.decorators = [(fn) => <Box w='330px'>{fn()}</Box>];
