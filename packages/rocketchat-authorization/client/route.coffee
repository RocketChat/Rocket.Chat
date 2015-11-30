FlowRouter.route '/admin/permissions/:name?',
	name: 'rocket-permissions'
	action: (params) ->
		if params?.name?
			BlazeLayout.render 'main',
				center: 'pageContainer'
				pageTitle: t('Role_Editing')
				pageTemplate: 'permissionsRole'
		else
			BlazeLayout.render 'main',
				center: 'pageContainer'
				pageTitle: t('Permissions')
				pageTemplate: 'permissions'
