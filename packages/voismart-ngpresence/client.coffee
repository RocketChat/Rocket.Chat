_userPresenceDisabled = false


window.addEventListener 'message', (e) ->
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
		if not _userPresenceDisabled
			console.log('disabling user presence')
			UserPresence.stopTimer()
			UserPresence.startTimer = ->
			_userPresenceDisabled = true
