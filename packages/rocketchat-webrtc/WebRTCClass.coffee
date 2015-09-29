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

	startCall: ->
		@log 'WebRTCTransportClass - startCall', @webrtcInstance.room, @webrtcInstance.selfId
		RocketChat.Notifications.notifyRoom @webrtcInstance.room, 'webrtc', 'call',
			from: @webrtcInstance.selfId

	joinCall: ->
		@log 'WebRTCTransportClass - joinCall', @webrtcInstance.room, @webrtcInstance.selfId
		RocketChat.Notifications.notifyRoom @webrtcInstance.room, 'webrtc', 'join',
			from: @webrtcInstance.selfId

	sendCandidate: (data) ->
		@log 'WebRTCTransportClass - sendCandidate', data, @webrtcInstance.room
		RocketChat.Notifications.notifyRoom @webrtcInstance.room, 'webrtc', 'candidate', data

	sendDescription: (data) ->
		@log 'WebRTCTransportClass - sendDescription', data, @webrtcInstance.room
		RocketChat.Notifications.notifyRoom @webrtcInstance.room, 'webrtc', 'description', data

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


class WebRTCClass
	config:
		iceServers: [
			{urls: "stun:stun.l.google.com:19302"}
			{urls: "stun:23.21.150.121"}
			{urls: "turn:numb.viagenie.ca:3478", username: "team@rocket.chat", credential: "demo"}
		]

	debug: true

	transportClass: WebRTCTransportClass

	constructor: (@selfId, @room) ->
		@peerConnections = {}
		@transport = new @transportClass @

		@transport.onRemoteCall @onRemoteCall.bind @
		@transport.onRemoteJoin @onRemoteJoin.bind @
		@transport.onRemoteCandidate @onRemoteCandidate.bind @
		@transport.onRemoteDescription @onRemoteDescription.bind @

	log: ->
		if @debug is true
			console.log.apply(console, arguments)

	onError: ->
		console.error.apply(console, arguments)

	updateRemoteUrls: ->
		urls = []
		for id, peerConnection of @peerConnections
			for remoteStream in peerConnection.getRemoteStreams()
				urls.push URL.createObjectURL(remoteStream)

		@onRemoteUrl?(urls)

	getPeerConnection: (id) ->
		self = @

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
			peerConnection.addEventListener eventName, (e) ->
				self.log id, e.type, e

		peerConnection.addEventListener 'icecandidate', (e) =>
			if not e.candidate?
				return

			self.transport.sendCandidate
				to: id
				from: @selfId
				candidate:
					candidate: e.candidate.candidate
					sdpMLineIndex: e.candidate.sdpMLineIndex
					sdpMid: e.candidate.sdpMid

		peerConnection.addEventListener 'addstream', (e) =>
			@updateRemoteUrls()

		peerConnection.addEventListener 'removestream', (e) =>
			@updateRemoteUrls()

		peerConnection.addEventListener 'iceconnectionstatechange', (e) =>
			target = e.srcElement or e.target

			if target.iceConnectionState in ['disconnected', 'closed']
				@stopPeerConnection id
				if Object.keys(@peerConnections).length is 0
					@stop()

		return peerConnection

	getLocalUserMedia: (callback) ->
		@log 'getLocalUserMedia', arguments
		self = @

		if self.localStream?
			return callback null, self.localStream

		media =
			audio: true
			video: true

		onSuccess = (stream) ->
			self.localStream = stream
			self.onSelfUrl?(URL.createObjectURL(stream))

			for id, peerConnection of self.peerConnections
				peerConnection.addStream stream

			callback null, self.localStream

		navigator.getUserMedia media, onSuccess, @onError

	stopPeerConnection: (id) ->
		peerConnection = @peerConnections[id]
		if not peerConnection? then return

		for stream in peerConnection.getLocalStreams()
			stream.stop()

		# for stream in peerConnection.getRemoteStreams
		# 	stream.stop()

		peerConnection.close()
		delete @peerConnections[id]

		@updateRemoteUrls()

	stop: ->
		@localStream.stop()
		for id, peerConnection of @peerConnections
			@stopPeerConnection id

	startCall: ->
		@log 'startCall', arguments
		@getLocalUserMedia (err, stream) =>
			@active = true
			@transport.startCall()

	onRemoteCall: (data) ->
		# Validate with user
		@joinCall()

	joinCall: ->
		@log 'joinCall', arguments
		@getLocalUserMedia (err, stream) =>
			@active = true
			@transport.joinCall()

	onRemoteJoin: (data) ->
		if @active isnt true then return

		@log 'onRemoteJoin', arguments
		@getLocalUserMedia (err, stream) =>
			peerConnection = @getPeerConnection data.from
			if peerConnection.iceConnectionState isnt 'new'
				return

			peerConnection.addStream @localStream if @localStream

			onOffer = (offer) =>
				onLocalDescription = =>
					@transport.sendDescription
						to: data.from
						from: @selfId
						type: 'offer'
						ts: Date.now() + TimeSync.serverOffset()
						description:
							sdp: offer.sdp
							type: offer.type

				peerConnection.setLocalDescription(new RTCSessionDescription(offer), onLocalDescription, @onError)

			peerConnection.createOffer(onOffer, @onError)

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
					from: @selfId
					type: 'answer'
					ts: Date.now() + TimeSync.serverOffset()
					description:
						sdp: answer.sdp
						type: answer.type
					# offer:
					# 	description: data.description

			peerConnection.setLocalDescription(new RTCSessionDescription(answer), onLocalDescription, @onError)

		peerConnection.createAnswer(onAnswer, @onError)


	### onRemoteCandidata
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


	### onRemoteDescription
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

		# if data.type is 'answer' and data.offer?.description?
		# 	peerConnection.setLocalDescription(new RTCSessionDescription(data.offer.description), emptyFn, @onError)

		console.log 'iceConnectionState', peerConnection.iceConnectionState
		console.log 'iceGatheringState', peerConnection.iceGatheringState
		console.log 'signalingState', peerConnection.signalingState
		# console.log 'localDescription', peerConnection.localDescription?.toJSON()
		# console.log 'remoteDescription', peerConnection.remoteDescription?.toJSON()
		peerConnection.setRemoteDescription new RTCSessionDescription(data.description)

		if data.type is 'offer'
			@onRemoteOffer
				from: data.from
				ts: data.ts
				# description: data.description


WebRTC = new class
	constructor: ->
		@instancesByRoomId = {}

	getInstanceByRoomId: (roomId) ->
		if not @instancesByRoomId[roomId]?
			@instancesByRoomId[roomId] = new WebRTCClass Meteor.userId(), roomId

		return @instancesByRoomId[roomId]


