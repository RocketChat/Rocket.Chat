Template.sideNav.helpers
	isAdmin: ->
		return Meteor.user()?.admin is true
	flexTemplate: ->
		return SideNav.getFlex().template
	flexData: ->
		return SideNav.getFlex().data

Template.sideNav.events
	'click .close-flex': ->
		SideNav.closeFlex()

	'click .arrow': ->
		SideNav.toggleCurrent()

	'mouseenter .header': ->
		SideNav.overArrow()

	'mouseleave .header': ->
		SideNav.leaveArrow()

	'click .open-settings': ->
		SideNav.setFlex "settingsFlex"
		SideNav.openFlex()

Template.sideNav.onRendered ->
	SideNav.init()
