Template.videoCall.onCreated ->
	@mainVideo = new ReactiveVar '$auto'


Template.videoCall.helpers
	videoAvaliable: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom'))?

	videoActive: ->
		webrtc = WebRTC.getInstanceByRoomId(Session.get('openedRoom'))
		overlay = @overlay?
		if overlay isnt webrtc?.overlayEnabled.get()
			return false

		return webrtc.localUrl.get()? or webrtc.remoteItems.get()?.length > 0

	callInProgress: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).callInProgress.get()

	overlayEnabled: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).overlayEnabled.get()

	audioEnabled: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).audioEnabled.get()

	videoEnabled: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).videoEnabled.get()

	audioAndVideoEnabled: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).audioEnabled.get() and WebRTC.getInstanceByRoomId(Session.get('openedRoom')).videoEnabled.get()

	screenShareAvailable: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).screenShareAvailable

	screenShareEnabled: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).screenShareEnabled.get()

	remoteVideoItems: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).remoteItems.get()

	selfVideoUrl: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).localUrl.get()

	mainVideoUrl: ->
		template = Template.instance()
		webrtc = WebRTC.getInstanceByRoomId(Session.get('openedRoom'))

		if template.mainVideo.get() is '$self'
			return webrtc.localUrl.get()

		if template.mainVideo.get() is '$auto'
			remoteItems = webrtc.remoteItems.get()
			if remoteItems?.length > 0
				return remoteItems[0].url

			return webrtc.localUrl.get()

		if webrtc.remoteItemsById.get()[template.mainVideo.get()]?
			return webrtc.remoteItemsById.get()[template.mainVideo.get()].url
		else
			template.mainVideo.set '$auto'
			return

	mainVideoUsername: ->
		template = Template.instance()
		webrtc = WebRTC.getInstanceByRoomId(Session.get('openedRoom'))

		if template.mainVideo.get() is '$self'
			return t 'you'

		if template.mainVideo.get() is '$auto'
			remoteItems = webrtc.remoteItems.get()
			if remoteItems?.length > 0
				return Meteor.users.findOne(remoteItems[0].id)?.username

			return t 'you'

		if webrtc.remoteItemsById.get()[template.mainVideo.get()]?
			return Meteor.users.findOne(webrtc.remoteItemsById.get()[template.mainVideo.get()].id)?.username
		else
			template.mainVideo.set '$auto'
			return

	usernameByUserId: (userId) ->
		return Meteor.users.findOne(userId)?.username


Template.videoCall.events
	'click .stop-call': ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).stop()

	'click .video-item': (e, t) ->
		t.mainVideo.set $(e.currentTarget).data('username')

	'click .disable-audio': (e, t) ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).disableAudio()

	'click .enable-audio': (e, t) ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).enableAudio()

	'click .disable-video': (e, t) ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).disableVideo()

	'click .enable-video': (e, t) ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).enableVideo()

	'click .disable-screen-share': (e, t) ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).disableScreenShare()

	'click .enable-screen-share': (e, t) ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).enableScreenShare()

	'click .disable-overlay': (e, t) ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).overlayEnabled.set(false)

	'click .enable-overlay': (e, t) ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).overlayEnabled.set(true)

	'loadstart video[muted]': (e) ->
		e.currentTarget.muted = true
		e.currentTarget.volume = 0
