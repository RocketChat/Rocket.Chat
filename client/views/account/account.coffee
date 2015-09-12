Template.account.helpers
	flexOpened: ->
		return 'opened' if RocketChat.TabBar.isFlexOpen()
	arrowPosition: ->
		console.log 'room.helpers arrowPosition' if window.rocketDebug
		return 'left' unless RocketChat.TabBar.isFlexOpen()

Template.account.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "accountFlex"
		SideNav.openFlex()
