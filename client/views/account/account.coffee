Template.account.helpers
	flexOpened: ->
		return 'opened' if FlexTab.isOpen()
	arrowPosition: ->
		console.log 'room.helpers arrowPosition' if window.rocketDebug
		return 'left' unless FlexTab.isOpen()

Template.account.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "accountFlex"
		SideNav.openFlex()
