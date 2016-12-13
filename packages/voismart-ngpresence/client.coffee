_installExtension = (browser) ->

	extensionAlert = $(".extension-alert")
	if not extensionAlert.length
		main = $("#rocket-chat")[0]
		if not main
			console.error 'voismart-ngpresence: cannot get main component'
			return
		Blaze.renderWithData(Template.extensionAlert, {'browser': browser}, main)
		extensionAlert = $(".extension-alert")
		if not extensionAlert.length
			# just give up
			console.error 'voismart-ngpresence: cannot get alert component'
			return

	extensionAlert.removeClass('hidden')


Meteor.startup ->
	RocketChat.settings.onload 'OrchestraIntegration_PresenceEnabled', (k, enabled) ->
		if not enabled
			return

		RocketChat.VoismartPresenceExtensionInstalled = false
		if navigator.userAgent.toLocaleLowerCase().indexOf('chrome') > -1
			browser = 'chrome'
		else if navigator.userAgent.toLocaleLowerCase().indexOf('firefox') > -1
			browser = 'firefox'
		else
			browser = undefined

		if browser and (not Meteor.isCordova) and Meteor.user()
			f = -> _installExtension(browser)
			_extensionPopupTimer = Meteor.setTimeout f, 90*1000

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
							Meteor.clearTimeout(_extensionPopupTimer)
							_extensionPopupTimer = undefined
						UserPresence.stopTimer()
						UserPresence.startTimer = ->
						_userPresenceDisabled = true
