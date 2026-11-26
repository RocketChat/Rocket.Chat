import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { Meta, StoryObj } from '@storybook/react';

import SidebarRailInbox from './SidebarRailInbox';
import { createFakeRoom, createFakeSubscription } from '../../../tests/mocks/data';

const room = (subscription: Parameters<typeof createFakeSubscription>[0]) =>
	({
		...createFakeRoom({ t: 'c' }),
		...createFakeSubscription({
			t: 'c',
			open: true,
			unread: 0,
			userMentions: 0,
			groupMentions: 0,
			tunread: [],
			tunreadUser: [],
			alert: false,
			...subscription,
		}),
	}) as unknown as SubscriptionWithRoom;

const inboxRoot = (subscriptions: SubscriptionWithRoom[]) =>
	mockAppRoot().withTranslations('en', 'core', { Inbox_and_home: 'Inbox and home' }).withSubscriptions(subscriptions).buildStoryDecorator();

export default {
	title: 'Sidebar/SidebarRail/SidebarRailInbox',
	component: SidebarRailInbox,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof SidebarRailInbox>;

type Story = StoryObj<typeof SidebarRailInbox>;

export const Default: Story = {
	decorators: [inboxRoot([])],
};

export const WithUnreads: Story = {
	decorators: [inboxRoot([room({ unread: 3 }), room({ unread: 2 })])],
};

export const WithAlertOnly: Story = {
	decorators: [inboxRoot([room({ alert: true })])],
};

export const WithThreads: Story = {
	decorators: [inboxRoot([room({ unread: 2 }), room({ alert: true, tunread: ['t1'] })])],
};

export const WithGroupMentions: Story = {
	decorators: [inboxRoot([room({ unread: 2 }), room({ unread: 1, groupMentions: 1 })])],
};

export const WithMentions: Story = {
	decorators: [
		inboxRoot([
			room({ alert: true }),
			room({ unread: 1, tunread: ['t1'] }),
			room({ unread: 2, userMentions: 2 }),
			room({ unread: 4, archived: true }),
		]),
	],
};

export const WithManyUnreads: Story = {
	decorators: [inboxRoot([room({ unread: 1200, userMentions: 1 })])],
};
