import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SessionContextValue } from '@rocket.chat/ui-contexts';
import { SessionContext } from '@rocket.chat/ui-contexts';
import type { Meta, StoryObj } from '@storybook/react';

import SidebarRailInbox from './SidebarRailInbox';

const baseRoot = () => mockAppRoot().withTranslations('en', 'core', { Inbox_and_home: 'Inbox and home' });

const withUnread = (unread: number | '999+' | '•') => {
	const session: SessionContextValue = {
		query: () => [() => () => undefined, () => unread],
		dispatch: () => undefined,
	};

	return baseRoot()
		.wrap((children) => <SessionContext.Provider value={session}>{children}</SessionContext.Provider>)
		.buildStoryDecorator();
};

export default {
	title: 'Sidebar/SidebarRail/SidebarRailInbox',
	component: SidebarRailInbox,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof SidebarRailInbox>;

type Story = StoryObj<typeof SidebarRailInbox>;

export const Default: Story = {
	decorators: [baseRoot().buildStoryDecorator()],
};

export const WithUnreads: Story = {
	decorators: [withUnread(5)],
};

export const WithManyUnreads: Story = {
	decorators: [withUnread('999+')],
};

export const WithAlertOnly: Story = {
	decorators: [withUnread('•')],
};
