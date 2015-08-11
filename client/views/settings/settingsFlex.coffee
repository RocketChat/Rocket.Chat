Template.settingsFlex.helpers
	groups: ->
		return Settings.find({type: 'group'}).fetch()
	label: ->
		return TAPi18next.t @i18nLabel

Template.settingsFlex.events
	'mouseenter header': ->
		SideNav.overArrow()

	'mouseleave header': ->
		SideNav.leaveArrow()

	'click header': ->
		SideNav.closeFlex()

	'click .cancel-settings': ->
		SideNav.closeFlex()
