@stdout = new Mongo.Collection 'stdout'

Meteor.startup ->
	RocketChat.AdminBox.addOption
		href: 'admin-view-logs'
		i18nLabel: 'View_Logs'
		permissionGranted: ->
			return RocketChat.authz.hasAllPermission('view-logs')

FlowRouter.route '/admin/view-logs',
	name: 'admin-view-logs'
	action: (params) ->
		BlazeLayout.render 'main',
			center: 'pageSettingsContainer'
			pageTitle: t('View_Logs')
			pageTemplate: 'viewLogs'
			noScroll: true
