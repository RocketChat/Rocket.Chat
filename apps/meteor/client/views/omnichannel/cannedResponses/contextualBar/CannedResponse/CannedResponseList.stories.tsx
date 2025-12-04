import { Contextualbar } from '@rocket.chat/ui-client';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';

import CannedResponseList from './CannedResponseList';

export default {
	component: CannedResponseList,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
} satisfies Meta<typeof CannedResponseList>;

export const Default: StoryFn<typeof CannedResponseList> = (args) => <CannedResponseList {...args} />;
Default.storyName = 'CannedResponseList';
Default.args = {
	options: [
		['all', 'All'],
		['global', 'Public'],
		['user', 'Private'],
	],
	cannedItems: [
		{
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
		{
			shortcut: 'test2',
			text: 'simple canned response test2',
			scope: 'Customer Support',
			tags: [],
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
		{
			shortcut: 'test3 long long long long long long long long long',
			text: 'simple canned response test3 long long long long long long long long long long long long long long long longlong long long long long long longlong long long long long long longlong long long long long long longlong long long long long long longlong long long long long long longlong long long long long long long',
			scope: 'Customer Support long long long long long long long long long long',
			tags: ['sales', 'support', 'long', 'long', 'long', 'long', 'long', 'long', 'long', 'long'],
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
	],
	itemCount: 3,
	loadMoreItems: action('loadMoreItems'),
};
Default.decorators = [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>];
