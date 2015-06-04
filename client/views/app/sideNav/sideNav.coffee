Template.sideNav.helpers
	flexTemplate: ->
		return SideNav.getFlex().template
	flexData: ->
		return SideNav.getFlex().data

Template.sideNav.events
	'click .close-flex': ->
		SideNav.closeFlex()

Template.sideNav.onRendered ->
	SideNav.init()
