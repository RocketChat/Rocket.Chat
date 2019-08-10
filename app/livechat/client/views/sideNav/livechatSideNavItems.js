import { ReactiveVar } from 'meteor/reactive-var';

export const sidebarItems = new ReactiveVar([]);
export const addSidebarItem = (title, slug, permission) => {
	sidebarItems.set([
		...sidebarItems.get(),
		{
			title,
			slug,
			permission,
		},
	]);
};

addSidebarItem('Current_Chats', 'livechat-current-chats', 'view-livechat-current-chats');
addSidebarItem('Analytics', 'livechat-analytics', 'view-livechat-analytics');
addSidebarItem('Real_Time_Monitoring', 'livechat-real-time-monitoring', 'view-livechat-real-time-monitoring');
addSidebarItem('Managers', 'livechat-managers', 'manage-livechat-managers');
addSidebarItem('Agents', 'livechat-agents', 'manage-livechat-agents');
addSidebarItem('Departments', 'livechat-departments', 'view-livechat-departments');
addSidebarItem('Triggers', 'livechat-triggers', 'view-livechat-triggers');
addSidebarItem('Custom_Fields', 'livechat-customfields', 'view-livechat-customfields');
addSidebarItem('Installation', 'livechat-installation', 'view-livechat-installation');
addSidebarItem('Appearance', 'livechat-appearance', 'view-livechat-appearance');
addSidebarItem('Webhooks', 'livechat-webhooks', 'view-livechat-webhooks');
addSidebarItem('Facebook Messenger', 'livechat-facebook', 'view-livechat-facebook');
addSidebarItem('Office_Hours', 'livechat-officeHours', 'view-livechat-officeHours');
