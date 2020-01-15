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

addSidebarItem('Current_Chats', 'omnichannel-current-chats', 'view-livechat-current-chats');
addSidebarItem('Analytics', 'omnichannel-analytics', 'view-livechat-analytics');
addSidebarItem('Real_Time_Monitoring', 'omnichannel-real-time-monitoring', 'view-livechat-real-time-monitoring');
addSidebarItem('Managers', 'omnichannel-managers', 'manage-livechat-managers');
addSidebarItem('Agents', 'omnichannel-agents', 'manage-livechat-agents');
addSidebarItem('Departments', 'omnichannel-departments', 'view-livechat-departments');
addSidebarItem('Triggers', 'omnichannel-livechat-triggers', 'view-livechat-triggers');
addSidebarItem('Custom_Fields', 'omnichannel-customfields', 'view-livechat-customfields');
addSidebarItem('Installation', 'omnichannel-livechat-installation', 'view-livechat-installation');
addSidebarItem('Appearance', 'omnichannel-livechat-appearance', 'view-livechat-appearance');
addSidebarItem('Webhooks', 'omnichannel-webhooks', 'view-livechat-webhooks');
addSidebarItem('Facebook Messenger', 'omnichannel-facebook', 'view-livechat-facebook');
addSidebarItem('Office_Hours', 'omnichannel-officeHours', 'view-livechat-officeHours');
