livechatManagerRoutes = FlowRouter.group({
	prefix: '/livechat-manager',
	name: 'livechat-manager'
});

AccountBox.addRoute({
	name: 'livechat-dashboard',
	path: '/dashboard',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Livechat_Dashboard',
	pageTemplate: 'livechatDashboard'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-current-chats',
	path: '/current',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Current_Chats',
	pageTemplate: 'livechatCurrentChats'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-users',
	path: '/users',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Livechat_Users',
	pageTemplate: 'livechatUsers'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-departments',
	path: '/departments',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Departments',
	pageTemplate: 'livechatDepartments'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-department-edit',
	path: '/departments/:_id/edit',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Edit_Department',
	pageTemplate: 'livechatDepartmentForm'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-department-new',
	path: '/departments/new',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'New_Department',
	pageTemplate: 'livechatDepartmentForm'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-triggers',
	path: '/triggers',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Triggers',
	pageTemplate: 'livechatTriggers'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-trigger-edit',
	path: '/triggers/:_id/edit',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Edit_Trigger',
	pageTemplate: 'livechatTriggersForm'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-trigger-new',
	path: '/triggers/new',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'New_Trigger',
	pageTemplate: 'livechatTriggersForm'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-installation',
	path: '/installation',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Installation',
	pageTemplate: 'livechatInstallation'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-appearance',
	path: '/appearance',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Appearance',
	pageTemplate: 'livechatAppearance'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-officeHours',
	path: '/officeHours',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Office_Hours',
	pageTemplate: 'livechatOfficeHours'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-customfields',
	path: '/customfields',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Custom_Fields',
	pageTemplate: 'livechatCustomFields'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-customfield-edit',
	path: '/customfields/:_id/edit',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Edit_Custom_Field',
	pageTemplate: 'livechatCustomFieldForm'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-customfield-new',
	path: '/customfields/new',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'New_Custom_Field',
	pageTemplate: 'livechatCustomFieldForm'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-webhooks',
	path: '/webhooks',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Webhooks',
	pageTemplate: 'livechatIntegrationWebhook'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-facebook',
	path: '/facebook',
	sideNav: 'livechatFlex',
	i18nPageTitle: 'Facebook Messenger',
	pageTemplate: 'livechatIntegrationFacebook'
}, livechatManagerRoutes);

AccountBox.addRoute({
	name: 'livechat-queue',
	path: '/livechat-queue',
	i18nPageTitle: 'Livechat_Queue',
	pageTemplate: 'livechatQueue'
});


