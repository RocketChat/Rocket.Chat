Template.videoButtons.helpers
	videoAvaliable: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom'))?

	videoActive: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).localUrl.get()? or WebRTC.getInstanceByRoomId(Session.get('openedRoom')).remoteItems.get()?.length > 0

	callInProgress: ->
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).callInProgress.get()


Template.videoButtons.events
	'click .start-video-call': ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).startCall({audio: true, video: true})

	'click .start-audio-call': ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).startCall({audio: true})

	'click .join-video-call': ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).joinCall({audio: true, video: true})

	'click .join-audio-call': ->
		WebRTC.getInstanceByRoomId(Session.get('openedRoom')).joinCall({audio: true})
