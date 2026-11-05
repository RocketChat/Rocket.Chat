import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import BroadcastMetrics from './BroadcastMetrics';
import DiscussionMetrics from './DiscussionMetrics';
import ThreadMetrics from './ThreadMetrics';

const lastMessageAt = new Date('2024-03-10T15:20:00.000Z');

const message = createFakeMessage({ _id: 'thread-main', rid: 'room' });

const meta = {
	title: 'Components/Message/Content/Metrics',
	component: ThreadMetrics,
	decorators: [
		mockAppRoot()
			.withUserPreference('displayAvatars', true)
			.withTranslations('en', 'core', {
				'View_thread': 'View thread',
				'Reply': 'Reply',
				'Following': 'Following',
				'Not_following': 'Not following',
				'Unread': 'Unread',
				'Mentions_you': 'Mentions you',
				'mention-all': 'Mentions everyone',
				'Follower_one': '{{count}} follower',
				'Follower_other': '{{count}} followers',
				'Last_message__date__': 'Last message: {{date}}',
				'__count__replies': '{{count}} replies',
				'__count__replies__date__': '{{count}} replies, {{date}}',
				'message_counter_one': '{{count}} message',
				'message_counter_other': '{{count}} messages',
				'No_messages_yet': 'No messages yet',
			})
			.buildStoryDecorator(),
	],
	parameters: { layout: 'padded' },
	args: {
		message,
		lm: lastMessageAt,
		counter: 4,
		participants: ['alice', 'bob', 'carol'],
		following: true,
		unread: false,
		mention: false,
		all: false,
	},
} satisfies Meta<typeof ThreadMetrics>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Thread: Story = {};

export const ThreadNotFollowed: Story = {
	args: { following: false },
};

export const ThreadUnread: Story = {
	args: { unread: true },
};

export const ThreadMentioningViewer: Story = {
	args: { unread: true, mention: true },
};

export const ThreadMentioningEveryone: Story = {
	args: { unread: true, all: true },
};

export const ThreadWithoutParticipants: Story = {
	args: { participants: [] },
};

export const Discussion: Story = {
	render: () => <DiscussionMetrics rid='room' drid='discussion' count={12} lm={lastMessageAt} />,
};

export const EmptyDiscussion: Story = {
	render: () => <DiscussionMetrics rid='room' drid='discussion' count={0} />,
};

export const Broadcast: Story = {
	render: () => <BroadcastMetrics username='alice' message={message} />,
};
