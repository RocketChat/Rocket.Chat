import { Box } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import Item from './Item';

export default {
	title: 'Enterprise/Omnichannel/Item',
	component: Item,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
} as ComponentMeta<typeof Item>;

export const Default: ComponentStory<typeof Item> = (args) => <Item {...args} />;
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
