_installExtension = (browser) ->
	refresh = ->
		swal
			type: "warning"
			title: TAPi18n.__ "Configure_Presence_Extension"
			text: TAPi18n.__ "Presence_Extension_Configuration", window.location.origin + '/*'

	extensionAlert = $(".extension-alert")
	if not extensionAlert.length
		main = $("#rocket-chat")[0]
		if not main
			console.error 'voismart-ngpresence: cannot get main component'
			return
		Blaze.render(Template.extensionAlert, main)
		extensionAlert = $(".extension-alert")
		if not extensionAlert.length
			# just give up
			console.error 'voismart-ngpresence: cannot get alert component'
			return

	extensionAlert.removeClass('hidden')


Meteor.startup ->
	if not RocketChat.settings.get('OrchestraIntegration_PresenceEnabled')
		return

	RocketChat.VoismartPresenceExtensionInstalled = false
	_extensionPopupTimer = undefined

	window.addEventListener 'message', (event) ->
		if (event.source != window) or (event.data.name != 'rocketchat_presence')
			return

		if event.data.type == "idlestatus"
			state = event.data.state
			if state == "idle"
				UserPresence.setAway()
			else if state == "active"
				UserPresence.setOnline()
			else if state == "locked"
				UserPresence.setAway()

		else if event.data.type == "extension_enabled"
			# disable UserPresence and use extension
			if not RocketChat.VoismartPresenceExtensionInstalled
				RocketChat.VoismartPresenceExtensionInstalled = true
				if _extensionPopupTimer
					console.error 'cancelling timeout'
					Meteor.clearTimeout(_extensionPopupTimer)
					_extensionPopupTimer = undefined
				console.log('disabling user presence')
				UserPresence.stopTimer()
				UserPresence.startTimer = ->
				_userPresenceDisabled = true

	# show extension popup
	if navigator.userAgent.toLocaleLowerCase().indexOf('chrome') > -1
		browser = 'chrome'
	else if navigator.userAgent.toLocaleLowerCase().indexOf('firefox') > -1
		browser = 'firefox'
	else
		browser = undefined

	if browser and (not Meteor.isCordova) and Meteor.user()
		f = -> _installExtension(browser)
		_extensionPopupTimer = Meteor.setTimeout f, 10000 # 90*1000
