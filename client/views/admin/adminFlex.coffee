Template.adminFlex.helpers
	groups: ->
		return Settings.find({type: 'group'}, { sort: { sort: 1, i18nLabel: 1 } }).fetch()
	label: ->
		return TAPi18n.__(@i18nLabel or @_id)
	adminBoxOptions: ->
		return RocketChat.AdminBox.getOptions()

Template.adminFlex.events
	'mouseenter header': ->
		SideNav.overArrow()

	'mouseleave header': ->
		SideNav.leaveArrow()

	'click header': ->
		SideNav.closeFlex()

	'click .cancel-settings': ->
		SideNav.closeFlex()

	'click .admin-link': ->
		menu.close()
