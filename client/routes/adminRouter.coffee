FlowRouter.route '/admin/users',
	name: 'admin-users'
	triggersExit: [ ->
		Session.set 'adminSelectedUser'
	]
	action: ->
		Session.set 'adminSelectedUser'
		RocketChat.TabBar.showGroup 'adminusers'
		BlazeLayout.render 'main', {center: 'adminUsers'}

FlowRouter.route '/admin/rooms',
	name: 'admin-rooms'
	action: ->
		RocketChat.TabBar.showGroup 'adminrooms'
		BlazeLayout.render 'main', {center: 'adminRooms'}

FlowRouter.route '/admin/statistics',
	name: 'admin-statistics'
	action: ->
		RocketChat.TabBar.showGroup 'adminstatistics'
		BlazeLayout.render 'main', {center: 'adminStatistics'}

FlowRouter.route '/admin/:group?',
	name: 'admin'
	action: ->
		RocketChat.TabBar.showGroup 'admin'
		BlazeLayout.render 'main', {center: 'admin'}
