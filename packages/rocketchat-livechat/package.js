Package.describe({
	name: 'rocketchat:livechat',
	version: '0.0.1',
	summary: 'Livechat plugin for Rocket.Chat'
});

Package.registerBuildPlugin({
	name: 'Livechat',
	use: [],
	sources: [
		'plugin/build-livechat.js'
	],
	npmDependencies: {
		'shelljs': '0.5.1'
	}
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use(['webapp', 'autoupdate'], 'server');
	api.use('ecmascript');
	api.use('rocketchat:lib');
	api.use('rocketchat:authorization');
	api.use('rocketchat:ui');
	api.use('kadira:flow-router', 'client');
	api.use('templating', 'client');
	api.use('http');
	api.use('mongo');
	api.use('rocketchat:sms');
	api.use('less@2.5.1');

	api.addFiles('livechat.js', 'server');
	api.addFiles('server/startup.js', 'server');
	api.addFiles('permissions.js', 'server');

	api.addFiles('config.js', 'server');

	api.addFiles('client/ui.js', 'client');
	api.addFiles('client/route.js', 'client');

	// add stylesheets to theme compiler
	api.addAssets('client/stylesheets/livechat.less', 'server');
	api.addFiles('client/stylesheets/load.js', 'server');

	// collections
	api.addFiles('client/collections/AgentUsers.js', 'client');
	api.addFiles('client/collections/LivechatCustomField.js', 'client');
	api.addFiles('client/collections/LivechatDepartment.js', 'client');
	api.addFiles('client/collections/LivechatDepartmentAgents.js', 'client');
	api.addFiles('client/collections/LivechatPageVisited.js', 'client');
	api.addFiles('client/collections/LivechatTrigger.js', 'client');

	api.addFiles('client/methods/changeLivechatStatus.js', 'client');

	// client views
	api.addFiles('client/views/app/livechatAppearance.html', 'client');
	api.addFiles('client/views/app/livechatAppearance.js', 'client');
	api.addFiles('client/views/app/livechatCurrentChats.html', 'client');
	api.addFiles('client/views/app/livechatCurrentChats.js', 'client');
	api.addFiles('client/views/app/livechatCustomFields.html', 'client');
	api.addFiles('client/views/app/livechatCustomFields.js', 'client');
	api.addFiles('client/views/app/livechatCustomFieldForm.html', 'client');
	api.addFiles('client/views/app/livechatCustomFieldForm.js', 'client');
	api.addFiles('client/views/app/livechatDashboard.html', 'client');
	api.addFiles('client/views/app/livechatDepartmentForm.html', 'client');
	api.addFiles('client/views/app/livechatDepartmentForm.js', 'client');
	api.addFiles('client/views/app/livechatDepartments.html', 'client');
	api.addFiles('client/views/app/livechatDepartments.js', 'client');
	api.addFiles('client/views/app/livechatInstallation.html', 'client');
	api.addFiles('client/views/app/livechatInstallation.js', 'client');
	api.addFiles('client/views/app/livechatTriggers.html', 'client');
	api.addFiles('client/views/app/livechatTriggers.js', 'client');
	api.addFiles('client/views/app/livechatUsers.html', 'client');
	api.addFiles('client/views/app/livechatUsers.js', 'client');

	api.addFiles('client/views/app/tabbar/externalSearch.html', 'client');
	api.addFiles('client/views/app/tabbar/externalSearch.js', 'client');
	api.addFiles('client/views/app/tabbar/visitorInfo.html', 'client');
	api.addFiles('client/views/app/tabbar/visitorInfo.js', 'client');

	api.addFiles('client/views/sideNav/livechat.html', 'client');
	api.addFiles('client/views/sideNav/livechat.js', 'client');
	api.addFiles('client/views/sideNav/livechatFlex.html', 'client');
	api.addFiles('client/views/sideNav/livechatFlex.js', 'client');

	api.addFiles('client/views/app/triggers/livechatTriggerAction.html', 'client');
	api.addFiles('client/views/app/triggers/livechatTriggerAction.js', 'client');
	api.addFiles('client/views/app/triggers/livechatTriggerCondition.html', 'client');
	api.addFiles('client/views/app/triggers/livechatTriggerCondition.js', 'client');

	// methods
	api.addFiles('server/methods/addAgent.js', 'server');
	api.addFiles('server/methods/addManager.js', 'server');
	api.addFiles('server/methods/changeLivechatStatus.js', 'server');
	api.addFiles('server/methods/getCustomFields.js', 'server');
	api.addFiles('server/methods/pageVisited.js', 'server');
	api.addFiles('server/methods/registerGuest.js', 'server');
	api.addFiles('server/methods/removeAgent.js', 'server');
	api.addFiles('server/methods/removeCustomField.js', 'server');
	api.addFiles('server/methods/removeDepartment.js', 'server');
	api.addFiles('server/methods/removeManager.js', 'server');
	api.addFiles('server/methods/removeTrigger.js', 'server');
	api.addFiles('server/methods/saveCustomField.js', 'server');
	api.addFiles('server/methods/saveDepartment.js', 'server');
	api.addFiles('server/methods/saveSurveyFeedback.js', 'server');
	api.addFiles('server/methods/saveTrigger.js', 'server');
	api.addFiles('server/methods/searchAgent.js', 'server');
	api.addFiles('server/methods/sendMessageLivechat.js', 'server');
	api.addFiles('server/methods/setCustomField.js', 'server');

	// models
	api.addFiles('server/models/Users.js', 'server');
	api.addFiles('server/models/Rooms.js', 'server');
	api.addFiles('server/models/LivechatExternalMessage.js', ['client', 'server']);
	api.addFiles('server/models/LivechatCustomField.js', 'server');
	api.addFiles('server/models/LivechatDepartment.js', 'server');
	api.addFiles('server/models/LivechatDepartmentAgents.js', 'server');
	api.addFiles('server/models/LivechatPageVisited.js', 'server');
	api.addFiles('server/models/LivechatTrigger.js', 'server');

	// server lib
	api.addFiles('server/lib/Livechat.js', 'server');
	api.addFiles('server/sendMessageBySMS.js', 'server');
	api.addFiles('server/externalMessageHook.js', 'server');

	// publications
	api.addFiles('server/publications/availableDepartments.js', 'server');
	api.addFiles('server/publications/customFields.js', 'server');
	api.addFiles('server/publications/departmentAgents.js', 'server');
	api.addFiles('server/publications/externalMessages.js', 'server');
	api.addFiles('server/publications/livechatAgents.js', 'server');
	api.addFiles('server/publications/livechatDepartments.js', 'server');
	api.addFiles('server/publications/livechatManagers.js', 'server');
	api.addFiles('server/publications/livechatRooms.js', 'server');
	api.addFiles('server/publications/trigger.js', 'server');
	api.addFiles('server/publications/visitorInfo.js', 'server');
	api.addFiles('server/publications/visitorPageVisited.js', 'server');
	api.addFiles('server/publications/visitorRoom.js', 'server');

	// api
	api.addFiles('server/api.js', 'server');

	// livechat app
	api.addAssets('assets/demo.html', 'client');
	api.addAssets('assets/rocket-livechat.js', 'client');
	api.addAssets('public/livechat.css', 'client');
	api.addAssets('public/livechat.js', 'client');
	api.addAssets('public/head.html', 'server');
});
