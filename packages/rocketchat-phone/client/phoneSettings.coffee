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


Template.phoneSettings.events
	'change #audioInDevice': (e, t) ->
		value = _.trim $(e.target).val()
		RocketChat.Phone.setAudioInDevice(value)

		console.log value
		console.log RocketChat.Phone.getAudioInDevice()

	'change #audioOutDevice': (e, t) ->
		value = _.trim $(e.target).val()
		RocketChat.Phone.setAudioOutDevice(value)

		console.log value
		console.log RocketChat.Phone.getAudioOutDevice()

	'change #videoDevice': (e, t) ->
		value = _.trim $(e.target).val()
		RocketChat.Phone.setVideoDevice(value)

		console.log value
		console.log RocketChat.Phone.getVideoDevice()
