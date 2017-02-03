FlowRouter.route '/admin/permissions',
	name: 'admin-permissions'
	action: (params) ->
		BlazeLayout.render 'main',
			center: 'pageContainer'
			pageTitle: t('Permissions')
			pageTemplate: 'permissions'

FlowRouter.route '/admin/permissions/:name?/edit',
	name: 'admin-permissions-edit'
	action: (params) ->
		BlazeLayout.render 'main',
			center: 'pageContainer'
			pageTitle: t('Role_Editing')
			pageTemplate: 'permissionsRole'

FlowRouter.route '/admin/permissions/new',
	name: 'admin-permissions-new'
	action: (params) ->
		BlazeLayout.render 'main',
			center: 'pageContainer'
			pageTitle: t('Role_Editing')
			pageTemplate: 'permissionsRole'
