Template.phoneSettings.helpers
	user: ->
		return Meteor.user()

	audioInDevices: ->
		devices = [{
			id: "none",
			label: "not set"
		}]
		return devices.concat $.verto.audioInDevices

	activeAudioInDevice: (id) ->
		if !id
			return false

		active = RocketChat.Phone.getAudioInDevice() is id
		return active

	audioOutDevices: ->
		devices = [{
			id: "none",
			label: "not set"
		}]
		return devices.concat $.verto.audioOutDevices

	activeAudioOutDevice: (id) ->
		if !id
			return false

		active = RocketChat.Phone.getAudioOutDevice() is id
		return active

	videoDevices: ->
		devices = [{
			id: "none",
			label: "not set"
		}]
		return devices.concat $.verto.videoDevices

	activeVideoDevice: (id) ->
		if !id
			return false

		active = RocketChat.Phone.getVideoDevice() is id
		return active

	resolutions: ->
		def = [[0, 'unset']]
		res = RocketChat.Phone.getResolutions()
		if window.rocketDebug
			console.log ">>>>>>>>>> CUR RES >>>>>>>>>>>"
			console.log res
			console.log ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
		return def.concat res

	usedeskphone: (checkValue, isdefault) ->
		res = RocketChat.Phone.getUseDeskPhone()

		if not res and isdefault is true
			res = checkValue

		return res is checkValue

	usevocalcommandesktop: (checkValue, isdefault) ->
		res = RocketChat.Phone.getCommandVocal()
		if not res and isdefault is true
			res = checkValue
		return res is checkValue

Template.phoneSettings.events
	'change #audioInDevice': (e, t) ->
		value = _.trim $(e.target).val()
		RocketChat.Phone.setAudioInDevice(value)

		if window.rocketDebug
			console.log value
			console.log RocketChat.Phone.getAudioInDevice()

	'change #audioOutDevice': (e, t) ->
		value = _.trim $(e.target).val()
		RocketChat.Phone.setAudioOutDevice(value)

		if window.rocketDebug
			console.log value
			console.log RocketChat.Phone.getAudioOutDevice()

	'change #videoDevice': (e, t) ->
		value = _.trim $(e.target).val()
		RocketChat.Phone.setVideoDevice(value)

		if window.rocketDebug
			console.log value
			console.log RocketChat.Phone.getVideoDevice()

	'change #videoResolution': (e, t) ->
		value = _.trim $(e.target).val()
		RocketChat.Phone.setVideoResolution(value)

		if window.rocketDebug
			console.log value

	'change #useDeskPhone': (e, t) ->
		value = _.trim $(e.target).val()
		RocketChat.Phone.setUseDeskPhone(value)

		if window.rocketDebug
			console.log value

	'change #useVocalCommand': (e, t) ->
		value = _.trim $(e.target).val()
		RocketChat.Phone.setUseVocalCommand(value)
