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
