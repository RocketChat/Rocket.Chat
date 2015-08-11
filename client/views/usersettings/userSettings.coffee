Template.userSettings.helpers
	flexOpened: ->
		return 'opened' if Session.equals('flexOpened', true)
	arrowPosition: ->
		console.log 'room.helpers arrowPosition' if window.rocketDebug
		return 'left' unless Session.equals('flexOpened', true)

Template.userSettings.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "userSettingsFlex"
		SideNav.openFlex()

Template.userSettings.events
	'click .submit button': (e, t) ->
		console.log 'submit button clicked'
		
		if t.child?.length > 0
			for child in t.child
				child.save?()