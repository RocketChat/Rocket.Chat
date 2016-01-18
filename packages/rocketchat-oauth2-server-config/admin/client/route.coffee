FlowRouter.route '/admin/oauth-apps',
	name: 'admin-oauth-apps'
	action: (params) ->
		BlazeLayout.render 'main',
			center: 'pageSettingsContainer'
			pageTitle: t('OAuth_Applications')
			pageTemplate: 'oauthApps'


FlowRouter.route '/admin/oauth-app/:id?',
	name: 'admin-oauth-app'
	action: (params) ->
		BlazeLayout.render 'main',
			center: 'pageSettingsContainer'
			pageTitle: t('OAuth_Application')
			pageTemplate: 'oauthApp'
			params: params
