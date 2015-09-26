emptyFn = ->
	# empty

webrtc =
	# cid: Random.id()
	pc: undefined
	to: undefined
	room: undefined
	activeMediastream: undefined
	remoteDataSDP: undefined
	mode: undefined
	lastSeenTimestamp: new Date()
	debug: true
	config:
		iceServers: [
			{url: "stun:stun.l.google.com:19302"}
			{url: "stun:23.21.150.121"}
			{
				url: "turn:team%40rocket.chat@numb.viagenie.ca:3478"
				"credential": "demo"
			}
		]

	send: (data) ->
		data.to = webrtc.to
		data.room = webrtc.room
		data.from = Meteor.user().username
		data.mod = if webrtc.mode then webrtc.mode else 0
		RocketChat.Notifications.notifyUser(data.to, 'webrtc', data)

	stop: (sendEvent) ->
		if webrtc.activeMediastream
			webrtc.activeMediastream = undefined

		if webrtc.pc
			if webrtc.pc.signalingState isnt 'closed'
				webrtc.pc.getLocalStreams().forEach (stream) -> stream.stop()
				webrtc.pc.getRemoteStreams().forEach (stream) -> stream.stop()
				webrtc.pc.close()
				webrtc.pc = undefined
				webrtc.mode = 0

		this.onRemoteUrl()
		this.onSelfUrl()
		if sendEvent isnt false
			RocketChat.Notifications.notifyUser webrtc.to, 'webrtc',
				to: webrtc.to
				room: webrtc.room
				from: Meteor.userId()
				close: true

	log: ->
		if webrtc.debug is true
			console.log.apply(console, arguments)

	onRemoteUrl: emptyFn
	onSelfUrl: emptyFn
	onAcceptCall: emptyFn

onError = ->
	console.log(arguments)


webrtc.activateLocalStream = ->
	media =
		audio: true
		video: true

	# get the local stream, show it in the local video element and send it
	navigator.getUserMedia media, (stream) ->
		webrtc.log 'getUserMedia got stream'
		webrtc.onSelfUrl URL.createObjectURL(stream)
		webrtc.activeMediastream = stream

	, (e) ->
		webrtc.log('getUserMedia failed during activateLocalStream ', e)


# run start(true) to initiate a call
webrtc.start = (isCaller, fromUsername) ->
	webrtc.pc = new RTCPeerConnection(webrtc.config)

	events = ['onicecandidate','onaddstream','oniceconnectionstatechange','ondatachannel','onidentityresult','onidpassertionerror','onidpvalidationerror','onnegotiationneeded','onpeeridentity','onremovestream','onsignalingstatechange']
	for e in events
		webrtc.pc[e] = ->
			webrtc.log e, arguments

	# send any ice candidates to the other peer
	webrtc.pc.onicecandidate = (evt) ->
		webrtc.log 'onicecandidate', arguments
		if evt.candidate
			webrtc.send
				"candidate": evt.candidate.toJSON()
				cid: webrtc.cid

	# once remote stream arrives, show it in the remote video element
	webrtc.pc.onaddstream = (evt) ->
		webrtc.log('onaddstream', arguments)
		webrtc.onRemoteUrl(URL.createObjectURL(evt.stream))

	webrtc.pc.oniceconnectionstatechange = (evt) ->
		webrtc.log('oniceconnectionstatechange', arguments)
		srcElement = evt.srcElement or evt.target

		if srcElement.iceConnectionState in ['disconnected', 'closed']
			if webrtc.pc
				webrtc.pc.getLocalStreams().forEach (stream) ->
					stream.stop()
					webrtc.onSelfUrl()

				webrtc.pc.getRemoteStreams().forEach (stream) ->
					if stream.stop
						stream.stop()

					webrtc.onRemoteUrl()

				webrtc.pc = undefined
				webrtc.mode = 0


	gotDescription = (desc) ->
		webrtc.pc.setLocalDescription desc, emptyFn, onError
		webrtc.send
			sdp: desc.toJSON()
			cid: webrtc.cid

	CreateMonitoringOffer = ->
		webrtc.pc.createOffer gotDescription, onError,
			mandatory:
				OfferToReceiveAudio: true
				OfferToReceiveVideo: true

	AutoConnectStream = ->
		webrtc.pc.addStream webrtc.activeMediastream
		webrtc.pc.setRemoteDescription new RTCSessionDescription(webrtc.remoteDataSDP)
		webrtc.pc.createAnswer gotDescription, onError

	LocalGetUserMedia = ->
		media =
			audio: true,
			video: true

		# get the local stream, show it in the local video element and send it
		navigator.getUserMedia media, (stream) ->
			webrtc.log('getUserMedia got stream')
			webrtc.onSelfUrl(URL.createObjectURL(stream))

			webrtc.pc.addStream(stream)

			if isCaller
				webrtc.pc.createOffer(gotDescription, onError)
			else
				webrtc.pc.createAnswer(gotDescription, onError)

		, (e) ->
			webrtc.log('getUserMedia failed', e)

	if isCaller
		webrtc.log('isCaller LocalGetUserMedia')

		if webrtc.mode
			if webrtc.mode is 2
				CreateMonitoringOffer()
			else # node === 1
				LocalGetUserMedia()
		else
			# no mode
			LocalGetUserMedia()

	else
		if not webrtc.activeMediastream
			swal
				title: "Video call from "+fromUsername
				text: "Do you want to accept?"
				type: "warning"
				showCancelButton: true
				confirmButtonColor: "#DD6B55"
				confirmButtonText: "Yes"
				cancelButtonText: "No"
			, (isConfirm) ->
				if isConfirm
					webrtc.onAcceptCall(fromUsername)
					LocalGetUserMedia()
				else
					webrtc.stop()
		else
			AutoConnectStream()


RocketChat.Notifications.onUser 'webrtc', (data) ->
	webrtc.log('processIncomingRtcMessage()', Meteor.userId(), data)
	if not webrtc.to
		webrtc.to = data.room.replace(Meteor.userId(), '')

	if not webrtc.room
		webrtc.room = data.room


	# do not stop local video if in monitoring mode
	if data.close is true
		if webrtc.activeMediastream
			if webrtc.pc
				webrtc.pc.getRemoteStreams().forEach (stream) ->
					if not stream.stop
						stream.stop()

				webrtc.pc = undefined;
				webrtc.mode = 0;
		else
			webrtc.stop(false)
		return


	if not webrtc.pc
		if webrtc.activeMediastream and data.sdp isnt undefined
			webrtc.remoteDataSDP = data.sdp

		webrtc.start(false, data.from)


	if data.sdp isnt undefined
		webrtc.pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
	else
		if webrtc.pc.iceConnectionState not in ["closed", "failed", "disconnected", "completed"]
			webrtc.pc.addIceCandidate(new RTCIceCandidate(data.candidate))

