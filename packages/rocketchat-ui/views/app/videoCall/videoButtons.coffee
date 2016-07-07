Template.videoButtons.helpers
	videoAvaliable: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom'))?

	videoActive: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).localUrl.get()? or WebRTC.getInstanceByRoomId(Session.get('openedRoom')).remoteItems.get()?.length > 0

	callInProgress: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).callInProgress.get()

	setSinkIdSupported: ->
		return WebRTC.setSinkIdSupported()

	videoInputDevices: -> WebRTC.getInstanceByRoomId(Session.get('openedRoom')).availableDevices.get().filter((d)->d.kind == 'videoinput')
	audioInputDevices: -> WebRTC.getInstanceByRoomId(Session.get('openedRoom')).availableDevices.get().filter((d)->d.kind == 'audioinput')
	audioOutputDevices: -> WebRTC.getInstanceByRoomId(Session.get('openedRoom')).availableDevices.get().filter((d)->d.kind == 'audiooutput')

	selectedVideoInputDevice: (deviceId) ->
		return deviceId == WebRTC.getInstanceByRoomId(Session.get('openedRoom')).videoInputDevice.get()

	selectedAudioInputDevice: (deviceId) ->
		return deviceId == WebRTC.getInstanceByRoomId(Session.get('openedRoom')).audioInputDevice.get()

	selectedAudioOutputDevice: (deviceId) ->
		return deviceId == WebRTC.getInstanceByRoomId(Session.get('openedRoom')).audioOutputDevice.get()

	showSettings: ->
		return Template.instance().showSettings.get()

Template.videoButtons.onCreated ->
	@showSettings = new ReactiveVar false

	@save = ->
		videoInputDevice = $('select[name=videoInputDevice]').val()
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).videoInputDevice.set(videoInputDevice)
		if audioInputDevice then localStorage.setItem('videoInputDevice', videoInputDevice)
		else localStorage.removeItem('videoInputDevice')

		audioInputDevice = $('select[name=audioInputDevice]').val()
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).audioInputDevice.set(audioInputDevice)
		if audioInputDevice then localStorage.setItem('audioInputDevice', audioInputDevice)
		else localStorage.removeItem('audioInputDevice')

		audioOutputDevice = $('select[name=audioOutputDevice]').val()
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).audioOutputDevice.set(audioOutputDevice)
		if audioOutputDevice then localStorage.setItem('audioOutputDevice', audioOutputDevice)
		else localStorage.removeItem('audioOutputDevice')

		@showSettings.set false


Template.videoButtons.events
	'click .start-video-call': ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).startCall({audio: true, video: true})

	'click .start-audio-call': ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).startCall({audio: true})

	'click .join-video-call': ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).joinCall({audio: true, video: true})

	'click .join-audio-call': ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).joinCall({audio: true})

	'click .show-settings': (e, t) ->
		t.showSettings.set !t.showSettings.get()

	'submit form': (e, t) ->
		e.stopPropagation()
		e.preventDefault()
		t.save()

