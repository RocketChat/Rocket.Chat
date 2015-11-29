FlowRouter.route '/admin/permissions',
	name: 'rocket-permissions'
	action: (params) ->
		BlazeLayout.render 'main',
			center: 'pageContainer'
			pageTitle: 'Permissions'
			pageTemplate: 'permissions'
