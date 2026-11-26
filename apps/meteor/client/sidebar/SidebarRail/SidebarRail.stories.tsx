import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import SidebarRail from './SidebarRail';

const baseRoot = () =>
	mockAppRoot().withTranslations('en', 'core', {
		Sidebar: 'Sidebar',
		Inbox_and_home: 'Inbox and home',
		Navigation: 'Navigation',
		Sidebar_preferences: 'Sidebar preferences',
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
