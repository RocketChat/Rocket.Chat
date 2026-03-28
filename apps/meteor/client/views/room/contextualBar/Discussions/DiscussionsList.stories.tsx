import { Contextualbar } from '@rocket.chat/ui-client';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';

import DiscussionsList from './DiscussionsList';

export default {
	component: DiscussionsList,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
	args: {
		text: '',
		loadMoreItems: action('loadMoreItems'),
	},
} satisfies Meta<typeof DiscussionsList>;

const Template: StoryFn<typeof DiscussionsList> = (args) => <DiscussionsList {...args} />;

const fakeDiscussions = Array.from({ length: 10 }, (_, i) => ({
	_id: String(i),
	msg: `Discussion ${i}`,
	ts: new Date('2024-01-01T00:00:00Z'),
	username: 'user.name',
	dcount: 5,
	dlm: new Date('2024-01-01T00:00:00Z'),
	drid: `drid-${i}`,
	rid: 'roomId',
	_updatedAt: new Date('2024-01-01T00:00:00Z'),
	u: {
		_id: 'user-id',
		username: 'user.name',
	},
}));

export const Default = Template.bind({});
Default.args = {
	isSuccess: true,
	discussions: fakeDiscussions,
	itemCount: fakeDiscussions.length,
};

export const Loading = Template.bind({});
Loading.args = {
	isPending: true,
};

export const Empty = Template.bind({});
Empty.args = {
	isSuccess: true,
	discussions: [],
	itemCount: 0,
};
