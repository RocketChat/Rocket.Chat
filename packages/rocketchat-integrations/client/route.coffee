FlowRouter.route '/admin/integrations',
	name: 'admin-integrations'
	action: (params) ->
		BlazeLayout.render 'main',
			center: 'pageSettingsContainer'
			pageTitle: t('Integrations')
			pageTemplate: 'integrations'


FlowRouter.route '/admin/integrations/new',
	name: 'admin-integrations-new'
	action: (params) ->
		BlazeLayout.render 'main',
			center: 'pageSettingsContainer'
			pageTitle: t('Integration_New')
			pageTemplate: 'integrationsNew'


FlowRouter.route '/admin/integrations/incoming/:id?',
	name: 'admin-integrations-incoming'
	action: (params) ->
		BlazeLayout.render 'main',
			center: 'pageSettingsContainer'
			pageTitle: t('Integration_Incoming_WebHook')
			pageTemplate: 'integrationsIncoming'
			params: params
