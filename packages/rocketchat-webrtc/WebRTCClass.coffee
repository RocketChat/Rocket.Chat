emptyFn = ->
	# empty

class WebRTCTransportClass
	debug: false

	log: ->
		if @debug is true
			console.log.apply(console, arguments)

	constructor: (@webrtcInstance) ->
		@callbacks = {}

		RocketChat.Notifications.onRoom @webrtcInstance.room, 'webrtc', (type, data) =>
			@log 'WebRTCTransportClass - onRoom', type, data

			switch type
				when 'status'
					if @callbacks['onRemoteStatus']?.length > 0
						fn(data) for fn in @callbacks['onRemoteStatus']

	onUserStream: (type, data) ->
		if data.room isnt @webrtcInstance.room then return
		@log 'WebRTCTransportClass - onUser', type, data

		switch type
			when 'call'
				if @callbacks['onRemoteCall']?.length > 0
					fn(data) for fn in @callbacks['onRemoteCall']

			when 'join'
				if @callbacks['onRemoteJoin']?.length > 0
					fn(data) for fn in @callbacks['onRemoteJoin']

			when 'candidate'
				if @callbacks['onRemoteCandidate']?.length > 0
					fn(data) for fn in @callbacks['onRemoteCandidate']

			when 'description'
				if @callbacks['onRemoteDescription']?.length > 0
					fn(data) for fn in @callbacks['onRemoteDescription']

	startCall: (data) ->
		@log 'WebRTCTransportClass - startCall', @webrtcInstance.room, @webrtcInstance.selfId
		RocketChat.Notifications.notifyUsersOfRoom @webrtcInstance.room, 'webrtc', 'call',
			from: @webrtcInstance.selfId
			room: @webrtcInstance.room
			media: data.media
			monitor: data.monitor

	joinCall: (data) ->
		@log 'WebRTCTransportClass - joinCall', @webrtcInstance.room, @webrtcInstance.selfId
		if data.monitor is true
			RocketChat.Notifications.notifyUser data.to, 'webrtc', 'join',
				from: @webrtcInstance.selfId
				room: @webrtcInstance.room
				media: data.media
				monitor: data.monitor
		else
			RocketChat.Notifications.notifyUsersOfRoom @webrtcInstance.room, 'webrtc', 'join',
				from: @webrtcInstance.selfId
				room: @webrtcInstance.room
				media: data.media
				monitor: data.monitor

	sendCandidate: (data) ->
		data.from = @webrtcInstance.selfId
		data.room = @webrtcInstance.room
		@log 'WebRTCTransportClass - sendCandidate', data
		RocketChat.Notifications.notifyUser data.to, 'webrtc', 'candidate', data

	sendDescription: (data) ->
		data.from = @webrtcInstance.selfId
		data.room = @webrtcInstance.room
		@log 'WebRTCTransportClass - sendDescription', data
		RocketChat.Notifications.notifyUser data.to, 'webrtc', 'description', data

	sendStatus: (data) ->
		@log 'WebRTCTransportClass - sendStatus', data, @webrtcInstance.room
		data.from = @webrtcInstance.selfId
		RocketChat.Notifications.notifyRoom @webrtcInstance.room, 'webrtc', 'status', data

	onRemoteCall: (fn) ->
		@callbacks['onRemoteCall'] ?= []
		@callbacks['onRemoteCall'].push fn

	onRemoteJoin: (fn) ->
		@callbacks['onRemoteJoin'] ?= []
		@callbacks['onRemoteJoin'].push fn

	onRemoteCandidate: (fn) ->
		@callbacks['onRemoteCandidate'] ?= []
		@callbacks['onRemoteCandidate'].push fn

	onRemoteDescription: (fn) ->
		@callbacks['onRemoteDescription'] ?= []
		@callbacks['onRemoteDescription'].push fn

	onRemoteStatus: (fn) ->
		@callbacks['onRemoteStatus'] ?= []
		@callbacks['onRemoteStatus'].push fn


class WebRTCClass
	config:
		iceServers: [
			{urls: "stun:stun.l.google.com:19302"}
			{urls: "stun:23.21.150.121"}
			{urls: "turn:numb.viagenie.ca:3478", username: "team@rocket.chat", credential: "demo"}
		]

	debug: true

	transportClass: WebRTCTransportClass


	###
		@param seldId {String}
		@param room {String}
	###
	constructor: (@selfId, @room) ->
		@peerConnections = {}

		@remoteItems = new ReactiveVar []
		@remoteItemsById = new ReactiveVar {}
		@callInProgress = new ReactiveVar false
		@audioEnabled = new ReactiveVar true
		@videoEnabled = new ReactiveVar true
		@localUrl = new ReactiveVar

		@active = false
		@remoteMonitoring = false
		@monitor = false
		@autoAccept = false

		@media =
			video: true
			audio: true

		@transport = new @transportClass @

		@transport.onRemoteCall @onRemoteCall.bind @
		@transport.onRemoteJoin @onRemoteJoin.bind @
		@transport.onRemoteCandidate @onRemoteCandidate.bind @
		@transport.onRemoteDescription @onRemoteDescription.bind @
		@transport.onRemoteStatus @onRemoteStatus.bind @

		Meteor.setInterval @broadcastStatus.bind(@), 1000

	log: ->
		if @debug is true
			console.log.apply(console, arguments)

	onError: ->
		console.error.apply(console, arguments)

	updateRemoteItems: ->
		items = []
		itemsById = {}

		for id, peerConnection of @peerConnections
			for remoteStream in peerConnection.getRemoteStreams()
				item =
					id: id
					url: URL.createObjectURL(remoteStream)
					state: peerConnection.iceConnectionState

				switch peerConnection.iceConnectionState
					when 'checking'
						item.stateText = 'Connecting...'

					when 'connected', 'completed'
						item.stateText = 'Connected'
						item.connected = true

					when 'disconnected'
						item.stateText = 'Disconnected'

					when 'failed'
						item.stateText = 'Failed'

					when 'closed'
						item.stateText = 'Closed'

				items.push item
				itemsById[id] = item

		@remoteItems.set items
		@remoteItemsById.set itemsById

	resetCallInProgress: ->
		@callInProgress.set false

	broadcastStatus: ->
		if @active isnt true or @monitor is true or @remoteMonitoring is true then return

		@transport.sendStatus
			remoteConnectionIds: Object.keys(@peerConnections)

	###
		@param data {Object}
			from {String}
			remoteConnectionIds {Array[String]}
	###
	onRemoteStatus: (data) ->
		# @log 'onRemoteStatus', arguments

		@callInProgress.set true

		Meteor.clearTimeout @callInProgressTimeout
		@callInProgressTimeout = Meteor.setTimeout @resetCallInProgress.bind(@), 2000

		if @active isnt true then return

		ids = [data.from].concat data.remoteConnectionIds

		for id in ids
			if id isnt @selfId and not @peerConnections[id]?
				@log 'reconnecting with', id
				@onRemoteJoin
					from: id

	###
		@param id {String}
	###
	getPeerConnection: (id) ->
		return @peerConnections[id] if @peerConnections[id]?

		peerConnection = new RTCPeerConnection @config
		@peerConnections[id] = peerConnection

		eventNames = [
			'icecandidate'
			'addstream'
			'removestream'
			'iceconnectionstatechange'
			'datachannel'
			'identityresult'
			'idpassertionerror'
			'idpvalidationerror'
			'negotiationneeded'
			'peeridentity'
			'signalingstatechange'
		]

		for eventName in eventNames
			peerConnection.addEventListener eventName, (e) =>
				@log id, e.type, e

		peerConnection.addEventListener 'icecandidate', (e) =>
			if not e.candidate?
				return

			@transport.sendCandidate
				to: id
				candidate:
					candidate: e.candidate.candidate
					sdpMLineIndex: e.candidate.sdpMLineIndex
					sdpMid: e.candidate.sdpMid

		peerConnection.addEventListener 'addstream', (e) =>
			@updateRemoteItems()

		peerConnection.addEventListener 'removestream', (e) =>
			@updateRemoteItems()

		peerConnection.addEventListener 'iceconnectionstatechange', (e) =>
			if peerConnection.iceConnectionState in ['disconnected', 'closed']
				@stopPeerConnection id
				Meteor.setTimeout =>
					if Object.keys(@peerConnections).length is 0
						@stop()
				, 3000

			@updateRemoteItems()

		return peerConnection


	###
		@param callback {Function}
	###
	getLocalUserMedia: (callback) ->
		@log 'getLocalUserMedia', arguments

		if @localStream?
			return callback null, @localStream

		onSuccess = (stream) =>
			@localStream = stream
			@localUrl.set URL.createObjectURL(stream)

			@videoEnabled.set @media.video is true
			@audioEnabled.set @media.audio is true

			for id, peerConnection of @peerConnections
				peerConnection.addStream stream

			callback null, @localStream

		navigator.getUserMedia @media, onSuccess, @onError


	###
		@param id {String}
	###
	stopPeerConnection: (id) ->
		peerConnection = @peerConnections[id]
		if not peerConnection? then return

		delete @peerConnections[id]
		peerConnection.close()

		@updateRemoteItems()

	setAudioEnabled: (enabled=true) ->
		if @localStream?
			if enabled is true and @media.audio isnt true
				@stop()
				@media.audio = true
				@joinCall()
			else
				@localStream.getAudioTracks().forEach (audio) -> audio.enabled = enabled
				@audioEnabled.set enabled

	disableAudio: ->
		@setAudioEnabled false

	enableAudio: ->
		@setAudioEnabled true

	setVideoEnabled: (enabled=true) ->
		if @localStream?
			if enabled is true and @media.video isnt true
				@stop()
				@media.video = true
				@joinCall()
			else
				@localStream.getVideoTracks().forEach (video) -> video.enabled = enabled
				@videoEnabled.set enabled

	disableVideo: ->
		@setVideoEnabled false

	enableVideo: ->
		@setVideoEnabled true

	stop: ->
		@active = false
		@monitor = false
		@remoteMonitoring = false
		@localStream?.stop()
		@localUrl.set undefined
		delete @localStream

		for id, peerConnection of @peerConnections
			@stopPeerConnection id


	###
		@param media {Object}
			audio {Boolean}
			video {Boolean}
	###
	startCall: (media={}) ->
		@log 'startCall', arguments
		@media = media
		@getLocalUserMedia =>
			@active = true
			@transport.startCall
				media: @media

	startCallAsMonitor: (media={}) ->
		@log 'startCallAsMonitor', arguments
		@media = media
		@active = true
		@monitor = true
		@transport.startCall
			media: @media
			monitor: true


	###
		@param data {Object}
			from {String}
			monitor {Boolean}
			media {Object}
				audio {Boolean}
				video {Boolean}
	###
	onRemoteCall: (data) ->
		if @autoAccept is true
			FlowRouter.goToRoomById data.room
			Meteor.defer =>
				@joinCall
					to: data.from
					monitor: data.monitor
					media: data.media
			return

		fromUsername = Meteor.users.findOne(data.from)?.username
		subscription = ChatSubscription.findOne({rid: data.room})

		if data.monitor is true
			icon = 'eye'
			title = "Monitor call from #{fromUsername}"
		else if subscription?.t is 'd'
			if data.media?.video
				icon = 'videocam'
				title = "Direct video call from #{fromUsername}"
			else
				icon = 'phone'
				title = "Direct audio call from #{fromUsername}"
		else
			if data.media?.video
				icon = 'videocam'
				title = "Group video call from #{subscription.name}"
			else
				icon = 'phone'
				title = "Group audio call from #{subscription.name}"

		swal
			title: "<i class='icon-#{icon} alert-icon'></i>#{title}"
			text: "Do you want to accept?"
			html: true
			showCancelButton: true
			confirmButtonText: "Yes"
			cancelButtonText: "No"
		, (isConfirm) =>
			if isConfirm
				FlowRouter.goToRoomById data.room
				Meteor.defer =>
					@joinCall
						to: data.from
						monitor: data.monitor
						media: data.media
			else
				@stop()


	###
		@param data {Object}
			to {String}
			monitor {Boolean}
			media {Object}
				audio {Boolean}
				video {Boolean}
	###
	joinCall: (data={}) ->
		if data.media?.audio?
			@media.audio = data.media.audio

		if data.media?.video?
			@media.video = data.media.video

		data.media = @media

		@log 'joinCall', arguments
		@getLocalUserMedia =>
			@remoteMonitoring = data.monitor
			@active = true
			@transport.joinCall(data)


	###
		@param data {Object}
			from {String}
			monitor {Boolean}
			media {Object}
				audio {Boolean}
				video {Boolean}
	###
	onRemoteJoin: (data) ->
		if @active isnt true then return

		@log 'onRemoteJoin', arguments

		peerConnection = @getPeerConnection data.from
		needsAudio = data.media.audio is true and peerConnection.getRemoteStreams()[0]?.getAudioTracks().length is 0
		needsVideo = data.media.video is true and peerConnection.getRemoteStreams()[0]?.getVideoTracks().length is 0
		if peerConnection.signalingState is "have-local-offer" or needsAudio or needsVideo
			@stopPeerConnection data.from
			peerConnection = @getPeerConnection data.from

		if peerConnection.iceConnectionState isnt 'new'
			return

		peerConnection.addStream @localStream if @localStream

		onOffer = (offer) =>
			onLocalDescription = =>
				@transport.sendDescription
					to: data.from
					type: 'offer'
					description:
						sdp: offer.sdp
						type: offer.type

			peerConnection.setLocalDescription(new RTCSessionDescription(offer), onLocalDescription, @onError)

		if data.monitor is true
			peerConnection.createOffer onOffer, @onError,
				mandatory:
					OfferToReceiveAudio: data.media.audio
					OfferToReceiveVideo: data.media.video
		else
			peerConnection.createOffer(onOffer, @onError)


	###
		@param data {Object}
			from {String}
	###
	onRemoteOffer: (data) ->
		if @active isnt true then return

		@log 'onRemoteOffer', arguments
		peerConnection = @getPeerConnection data.from

		if peerConnection.iceConnectionState isnt 'new'
			return

		peerConnection.addStream @localStream if @localStream

		onAnswer = (answer) =>
			onLocalDescription = =>
				@transport.sendDescription
					to: data.from
					type: 'answer'
					description:
						sdp: answer.sdp
						type: answer.type

			peerConnection.setLocalDescription(new RTCSessionDescription(answer), onLocalDescription, @onError)

		peerConnection.createAnswer(onAnswer, @onError)


	###
		@param data {Object}
			to {String}
			from {String}
			candidate {RTCIceCandidate JSON encoded}
	###
	onRemoteCandidate: (data) ->
		if @active isnt true then return
		if data.to isnt @selfId then return

		@log 'onRemoteCandidate', arguments
		peerConnection = @getPeerConnection data.from

		if peerConnection.iceConnectionState not in ["closed", "failed", "disconnected", "completed"]
			peerConnection.addIceCandidate new RTCIceCandidate(data.candidate)


	###
		@param data {Object}
			to {String}
			from {String}
			type {String} [offer, answer]
			description {RTCSessionDescription JSON encoded}
	###
	onRemoteDescription: (data) ->
		if @active isnt true then return
		if data.to isnt @selfId then return

		@log 'onRemoteDescription', arguments
		peerConnection = @getPeerConnection data.from

		peerConnection.setRemoteDescription new RTCSessionDescription(data.description)

		if data.type is 'offer'
			@onRemoteOffer
				from: data.from


WebRTC = new class
	constructor: ->
		@instancesByRoomId = {}

	getInstanceByRoomId: (roomId) ->
		if not @instancesByRoomId[roomId]?
			@instancesByRoomId[roomId] = new WebRTCClass Meteor.userId(), roomId

		return @instancesByRoomId[roomId]


Meteor.startup ->
	RocketChat.Notifications.onUser 'webrtc', (type, data) =>
		if not data.room? then return

		webrtc = WebRTC.getInstanceByRoomId(data.room)

		webrtc.transport.onUserStream type, data
