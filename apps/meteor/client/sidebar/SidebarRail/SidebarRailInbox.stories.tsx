import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { Meta, StoryObj } from '@storybook/react';

import SidebarRailInbox from './SidebarRailInbox';
import { createFakeRoom, createFakeSubscription } from '../../../tests/mocks/data';

const room = (subscription: Parameters<typeof createFakeSubscription>[0]) =>
	({
		...createFakeSubscription({
			open: true,
			userMentions: 0,
			groupMentions: 0,
			tunread: [],
			tunreadUser: [],
			alert: false,
			...subscription,
		}),
		...createFakeRoom({ t: 'c' }),
	}) as unknown as SubscriptionWithRoom;

const baseRoot = () => mockAppRoot().withTranslations('en', 'core', { Inbox_and_home: 'Inbox and home' });

export default {
	title: 'Sidebar/SidebarRail/SidebarRailInbox',
	component: SidebarRailInbox,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof SidebarRailInbox>;

type Story = StoryObj<typeof SidebarRailInbox>;

export const Default: Story = {
	decorators: [baseRoot().withSubscriptions([]).buildStoryDecorator()],
};

export const WithUnreads: Story = {
	decorators: [
		baseRoot()
			.withSubscriptions([room({ unread: 3 }), room({ unread: 2 }), room({ unread: 10, hideUnreadStatus: true })])
			.buildStoryDecorator(),
	],
};

export const WithMentions: Story = {
	decorators: [
		baseRoot()
			.withSubscriptions([room({ unread: 3 }), room({ unread: 1, userMentions: 1 })])
			.buildStoryDecorator(),
	],
};
