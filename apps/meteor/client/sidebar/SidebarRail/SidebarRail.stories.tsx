import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { SessionContext } from '@rocket.chat/ui-contexts';
import type { SessionContextValue } from '@rocket.chat/ui-contexts';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';

import SidebarRail from './SidebarRail';

const sessionMock = (state: Record<string, unknown>): SessionContextValue => ({
	query: (name) => [() => () => undefined, () => state[name]],
	dispatch: () => undefined,
});

const baseRoot = () =>
	mockAppRoot().withSetting('Layout_Show_Home_Button', true).withTranslations('en', 'core', {
		Sidebar: 'Sidebar',
		Home: 'Home',
		Create_new: 'Create new',
		Voice_Call: 'Voice Call',
		Pages_and_actions: 'Pages and actions',
		Workspace_and_user_preferences: 'Workspace and user preferences',
	});

export default {
	title: 'Sidebar/SidebarRail',

	component: SidebarRail,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story) => (
			<Box height='100vh' display='flex'>
				<Story />
			</Box>
		),
	],
} satisfies Meta<typeof SidebarRail>;

type Story = StoryObj<typeof SidebarRail>;

export const Anonymous: Story = {
	decorators: [baseRoot().buildStoryDecorator()],
};

export const LoggedIn: Story = {
	decorators: [baseRoot().withJohnDoe().buildStoryDecorator()],
};

export const WithUnreadBadge: Story = {
	decorators: [
		baseRoot()
			.withJohnDoe()
			.wrap((children: ReactNode) => <SessionContext.Provider value={sessionMock({ unread: 5 })}>{children}</SessionContext.Provider>)
			.buildStoryDecorator(),
	],
};

export const WithCreatePermissions: Story = {
	decorators: [
		baseRoot().withJohnDoe().withPermission('create-c').withPermission('create-p').withPermission('create-d').buildStoryDecorator(),
	],
};
