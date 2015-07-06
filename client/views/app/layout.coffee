Template.appLayout.helpers
	flexOpened: ->
		console.log 'layout.helpers flexOpened' if window.rocketDebug
		return 'flex-opened' if Session.equals('flexOpened', true)

	flexOpenedRTC1: ->
		console.log 'layout.helpers flexOpenedRTC1' if window.rocketDebug
		return 'layout1' if Session.equals('flexOpenedRTC1', true)

	flexOpenedRTC2: ->
		console.log 'layout.helpers flexOpenedRTC2' if window.rocketDebug
		return 'layout2' if Session.equals('flexOpenedRTC2', true)


Template.appLayout.rendered = ->
	$('html').addClass("noscroll").removeClass "scroll"
	
	# RTL Support - Need config option on the UI
	if isRtl localStorage.getItem "userLanguage"
		$('html').addClass "rtl"
