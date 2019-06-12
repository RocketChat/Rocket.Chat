export const sidebarItems = [];
export const addSidebarItem = (title, slug) => {
	sidebarItems.push({
		title,
		slug,
	});
}

addSidebarItem("Current_Chats", "livechat-current-chats");
addSidebarItem("Analytics", "livechat-analytics");
addSidebarItem("Real_Time_Monitoring", "livechat-real-time-monitoring");
addSidebarItem("Managers", "livechat-managers");
addSidebarItem("Agents", "livechat-agents");
addSidebarItem("Departments", "livechat-departments");
addSidebarItem("Triggers", "livechat-triggers");
addSidebarItem("Custom_Fields", "livechat-customfields");
addSidebarItem("Installation", "livechat-installation");
addSidebarItem("Appearance", "livechat-appearance");
addSidebarItem("Webhooks", "livechat-webhooks");
addSidebarItem("Facebook Messenger", "livechat-facebook");
addSidebarItem("Office_Hours", "livechat-officeHours");
