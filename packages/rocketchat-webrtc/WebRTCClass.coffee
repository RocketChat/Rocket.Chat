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
		iceServers: []

	debug: false

	transportClass: WebRTCTransportClass


	###
		@param seldId {String}
		@param room {String}
	###
	constructor: (@selfId, @room) ->
		@config.iceServers = []

		servers = RocketChat.settings.get("WebRTC_Servers")
		if servers?.trim() isnt ''
			servers = servers.replace /\s/g, ''
			servers = servers.split ','
			for server in servers
				server = server.split '@'
				serverConfig =
					urls: server.pop()

				if server.length is 1
					server = server[0].split ':'
					serverConfig.username = decodeURIComponent(server[0])
					serverConfig.credential = decodeURIComponent(server[1])

				@config.iceServers.push serverConfig

		@peerConnections = {}

		@remoteItems = new ReactiveVar []
		@remoteItemsById = new ReactiveVar {}
		@callInProgress = new ReactiveVar false
		@audioEnabled = new ReactiveVar true
		@videoEnabled = new ReactiveVar true
		@overlayEnabled = new ReactiveVar false
		@screenShareEnabled = new ReactiveVar false
		@localUrl = new ReactiveVar

		@active = false
		@remoteMonitoring = false
		@monitor = false
		@autoAccept = false

		@navigator = undefined
		if navigator.userAgent.toLocaleLowerCase().indexOf('chrome') > -1
			@navigator = 'chrome'
		else if navigator.userAgent.toLocaleLowerCase().indexOf('firefox') > -1
			@navigator = 'firefox'
		else if navigator.userAgent.toLocaleLowerCase().indexOf('safari') > -1
			@navigator = 'safari'

		@screenShareAvailable = @navigator in ['chrome', 'firefox']

		@media =
			video: true
			audio: true

		@transport = new @transportClass @

		@transport.onRemoteCall @onRemoteCall.bind @
		@transport.onRemoteJoin @onRemoteJoin.bind @
		@transport.onRemoteCandidate @onRemoteCandidate.bind @
		@transport.onRemoteDescription @onRemoteDescription.bind @
		@transport.onRemoteStatus @onRemoteStatus.bind @

		Meteor.setInterval @checkPeerConnections.bind(@), 1000

		# Meteor.setInterval @broadcastStatus.bind(@), 1000

	log: ->
		if @debug is true
			console.log.apply(console, arguments)

	onError: ->
		console.error.apply(console, arguments)

	checkPeerConnections: ->
		for id, peerConnection of @peerConnections
			if peerConnection.iceConnectionState not in ['connected', 'completed'] and peerConnection.createdAt + 5000 < Date.now()
				@stopPeerConnection id

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

		remoteConnections = []
		for id, peerConnections of @peerConnections
			remoteConnections.push
				id: id
				media: peerConnections.remoteMedia

		@transport.sendStatus
			media: @media
			remoteConnections: remoteConnections

	###
		@param data {Object}
			from {String}
			media {Object}
			remoteConnections {Array[Object]}
				id {String}
				media {Object}
	###
	onRemoteStatus: (data) ->
		# @log 'onRemoteStatus', arguments

		@callInProgress.set true

		Meteor.clearTimeout @callInProgressTimeout
		@callInProgressTimeout = Meteor.setTimeout @resetCallInProgress.bind(@), 2000

		if @active isnt true then return

		remoteConnections = [{id: data.from, media: data.media}].concat data.remoteConnections

		for remoteConnection in remoteConnections
			if remoteConnection.id isnt @selfId and not @peerConnections[remoteConnection.id]?
				@log 'reconnecting with', remoteConnection.id
				@onRemoteJoin
					from: remoteConnection.id
					media: remoteConnection.media

	###
		@param id {String}
	###
	getPeerConnection: (id) ->
		return @peerConnections[id] if @peerConnections[id]?

		peerConnection = new RTCPeerConnection @config

		peerConnection.createdAt = Date.now()
		peerConnection.remoteMedia = {}

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
			if peerConnection.iceConnectionState in ['disconnected', 'closed'] and peerConnection is @peerConnections[id]
				@stopPeerConnection id
				Meteor.setTimeout =>
					if Object.keys(@peerConnections).length is 0
						@stop()
				, 3000

			@updateRemoteItems()

		return peerConnection

	_getUserMedia: (media, onSuccess, onError) ->
		onSuccessLocal = (stream) ->
			if AudioContext? and stream.getAudioTracks().length > 0
				audioContext = new AudioContext
				source = audioContext.createMediaStreamSource(stream)

				volume = audioContext.createGain()
				source.connect(volume)
				peer = audioContext.createMediaStreamDestination()
				volume.connect(peer)
				volume.gain.value = 0.6

				stream.removeTrack(stream.getAudioTracks()[0])
				stream.addTrack(peer.stream.getAudioTracks()[0])
				stream.volume = volume

			onSuccess(stream)

		navigator.getUserMedia media, onSuccessLocal, onError


	getUserMedia: (media, onSuccess, onError=@onError) ->
		if media.desktop isnt true
			@_getUserMedia media, onSuccess, onError
			return

		if @screenShareAvailable isnt true
			console.log 'Screen share is not avaliable'
			return

		getScreen = (audioStream) =>
			if document.cookie.indexOf("rocketchatscreenshare=chrome") is -1 and not window.rocketchatscreenshare?
				refresh = ->
					swal
						type: "warning"
						title: TAPi18n.__ "Refresh_your_page_after_install_to_enable_screen_sharing"

				swal
					type: "warning"
					title: TAPi18n.__ "Screen_Share"
					text: TAPi18n.__ "You_need_install_an_extension_to_allow_screen_sharing"
					html: true
					showCancelButton: true
					confirmButtonText: TAPi18n.__ "Install_Extension"
					cancelButtonText: TAPi18n.__ "Cancel"
				, (isConfirm) =>
					if isConfirm
						if @navigator is 'chrome'
							chrome.webstore.install undefined, refresh, ->
								window.open('https://chrome.google.com/webstore/detail/rocketchat-screen-share/nocfbnnmjnndkbipkabodnheejiegccf')
								refresh()
						else if @navigator is 'firefox'
							window.open('https://addons.mozilla.org/en-GB/firefox/addon/rocketchat-screen-share/')
							refresh()

				return onError(false)

			getScreenSuccess = (stream) =>
				if audioStream?
					stream.addTrack(audioStream.getAudioTracks()[0])
				onSuccess(stream)

			if @navigator is 'firefox'
				media =
					audio: media.audio
					video:
						mozMediaSource: 'window'
						mediaSource: 'window'
				@_getUserMedia media, getScreenSuccess, onError
			else
				ChromeScreenShare.getSourceId (id) =>
					console.log id
					media =
						audio: false
						video:
							mandatory:
								chromeMediaSource: 'desktop'
								chromeMediaSourceId: id
								maxWidth: 1280
								maxHeight: 720

					@_getUserMedia media, getScreenSuccess, onError

		if @navigator is 'firefox' or not media.audio? or media.audio is false
			getScreen()
		else
			getAudioSuccess = (audioStream) =>
				getScreen(audioStream)

			getAudioError = =>
				getScreen()

			@_getUserMedia {audio: media.audio}, getAudioSuccess, getAudioError


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

		onError = (error) =>
			callback false
			@onError error

		@getUserMedia @media, onSuccess, onError


	###
		@param id {String}
	###
	stopPeerConnection: (id) ->
		peerConnection = @peerConnections[id]
		if not peerConnection? then return

		delete @peerConnections[id]
		peerConnection.close()

		@updateRemoteItems()

	stopAllPeerConnections: ->
		for id, peerConnection of @peerConnections
				@stopPeerConnection id

	setAudioEnabled: (enabled=true) ->
		if @localStream?
			if enabled is true and @media.audio isnt true
				delete @localStream
				@media.audio = true
				@getLocalUserMedia =>
					@stopAllPeerConnections()
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
				delete @localStream
				@media.video = true
				@getLocalUserMedia =>
					@stopAllPeerConnections()
					@joinCall()
			else
				@localStream.getVideoTracks().forEach (video) -> video.enabled = enabled
				@videoEnabled.set enabled

	disableScreenShare: ->
		@setScreenShareEnabled false

	enableScreenShare: ->
		@setScreenShareEnabled true

	setScreenShareEnabled: (enabled=true) ->
		if @localStream?
			@media.desktop = enabled
			delete @localStream
			@getLocalUserMedia (err) =>
				if err?
					return
				@screenShareEnabled.set enabled
				@stopAllPeerConnections()
				@joinCall()

	disableVideo: ->
		@setVideoEnabled false

	enableVideo: ->
		@setVideoEnabled true

	stop: ->
		@active = false
		@monitor = false
		@remoteMonitoring = false
		if @localStream? and typeof @localStream isnt 'undefined'
			@localStream.getTracks().forEach (track) ->
				track.stop()
		@localUrl.set undefined
		delete @localStream

		@stopAllPeerConnections()


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
				desktop {Boolean}
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
				desktop {Boolean}
	###
	onRemoteJoin: (data) ->
		if @active isnt true then return

		@log 'onRemoteJoin', arguments

		peerConnection = @getPeerConnection data.from

		# needsRefresh = false
		# if peerConnection.iceConnectionState isnt 'new'
		# 	needsAudio = data.media.audio is true and peerConnection.remoteMedia.audio isnt true
		# 	needsVideo = data.media.video is true and peerConnection.remoteMedia.video isnt true
		# 	needsRefresh = needsAudio or needsVideo or data.media.desktop isnt peerConnection.remoteMedia.desktop

		# if peerConnection.signalingState is "have-local-offer" or needsRefresh
		if peerConnection.signalingState isnt "checking"
			@stopPeerConnection data.from
			peerConnection = @getPeerConnection data.from

		if peerConnection.iceConnectionState isnt 'new'
			return

		peerConnection.remoteMedia = data.media

		peerConnection.addStream @localStream if @localStream

		onOffer = (offer) =>
			onLocalDescription = =>
				@transport.sendDescription
					to: data.from
					type: 'offer'
					ts: peerConnection.createdAt
					media: @media
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
			ts {Integer}
			description {String}
	###
	onRemoteOffer: (data) ->
		if @active isnt true then return

		@log 'onRemoteOffer', arguments
		peerConnection = @getPeerConnection data.from

		if peerConnection.signalingState in ["have-local-offer", "stable"] and peerConnection.createdAt < data.ts
			@stopPeerConnection data.from
			peerConnection = @getPeerConnection data.from

		if peerConnection.iceConnectionState isnt 'new'
			return

		peerConnection.setRemoteDescription new RTCSessionDescription(data.description)

		try peerConnection.addStream @localStream if @localStream

		onAnswer = (answer) =>
			onLocalDescription = =>
				@transport.sendDescription
					to: data.from
					type: 'answer'
					ts: peerConnection.createdAt
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
			ts {Integer}
			media {Object}
				audio {Boolean}
				video {Boolean}
				desktop {Boolean}
	###
	onRemoteDescription: (data) ->
		if @active isnt true then return
		if data.to isnt @selfId then return

		@log 'onRemoteDescription', arguments
		peerConnection = @getPeerConnection data.from

		if data.type is 'offer'
			peerConnection.remoteMedia = data.media
			@onRemoteOffer
				from: data.from
				ts: data.ts
				description: data.description
		else
			peerConnection.setRemoteDescription new RTCSessionDescription(data.description)


WebRTC = new class
	constructor: ->
		@instancesByRoomId = {}

	getInstanceByRoomId: (roomId) ->
		subscription = ChatSubscription.findOne({rid: roomId})
		if not subscription
			return

		enabled = false
		switch subscription.t
			when 'd'
				enabled = RocketChat.settings.get('WebRTC_Enable_Direct')
			when 'p'
				enabled = RocketChat.settings.get('WebRTC_Enable_Private')
			when 'c'
				enabled = RocketChat.settings.get('WebRTC_Enable_Channel')

		if enabled is false
			return

		if not @instancesByRoomId[roomId]?
			@instancesByRoomId[roomId] = new WebRTCClass Meteor.userId(), roomId

		return @instancesByRoomId[roomId]


Meteor.startup ->
	Tracker.autorun ->
		if Meteor.userId()
			RocketChat.Notifications.onUser 'webrtc', (type, data) =>
				if not data.room? then return

				webrtc = WebRTC.getInstanceByRoomId(data.room)

				webrtc.transport.onUserStream type, data
