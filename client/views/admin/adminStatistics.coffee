Template.adminStatistics.helpers
	isAdmin: ->
		return Meteor.user().admin is true

Template.adminUsers.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "adminFlex"
		SideNav.openFlex()

