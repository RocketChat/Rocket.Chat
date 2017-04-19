/* globals chrome, ChromeScreenShare */
class WebRTCTransportClass {
	constructor(webrtcInstance) {
		this.debug = false;
		this.webrtcInstance = webrtcInstance;
		this.callbacks = {};
		RocketChat.Notifications.onRoom(this.webrtcInstance.room, 'webrtc', (type, data) => {
			const onRemoteStatus = this.callbacks['onRemoteStatus'];
			this.log('WebRTCTransportClass - onRoom', type, data);
			switch (type) {
				case 'status':
					if (onRemoteStatus && onRemoteStatus.length) {
						onRemoteStatus.forEach((fn) => fn(data));
					}
			}
		});
	}

	log() {
		if (this.debug === true) {
			return console.log.apply(console, arguments);
		}
	}

	onUserStream(type, data) {
		if (data.room !== this.webrtcInstance.room) {
			return;
		}
		this.log('WebRTCTransportClass - onUser', type, data);
		console.log(this.callbacks);
		const onRemoteCall = this.callbacks['onRemoteCall'];
		const onRemoteJoin = this.callbacks['onRemoteJoin'];
		const onRemoteCandidate = this.callbacks['onRemoteCandidate'];
		const onRemoteDescription = this.callbacks['onRemoteDescription'];

		switch (type) {
			case 'call':
				if (onRemoteCall && onRemoteCall.length) {
					onRemoteCall.forEach((fn) => {
						fn(data);
					});
				}
				break;
			case 'join':
				if (onRemoteJoin && onRemoteJoin.length) {
					onRemoteJoin.forEach((fn) => fn(data));
				}
				break;
			case 'candidate':
				if (onRemoteCandidate && onRemoteCandidate.length) {
					onRemoteCandidate.forEach((fn) => fn(data));
				}
				break;
			case 'description':
				if (onRemoteDescription && onRemoteDescription.length) {
					onRemoteDescription.forEach((fn) => fn(data));
				}
		}
	}

	startCall(data) {
		this.log('WebRTCTransportClass - startCall', this.webrtcInstance.room, this.webrtcInstance.selfId);
		return RocketChat.Notifications.notifyUsersOfRoom(this.webrtcInstance.room, 'webrtc', 'call', {
			from: this.webrtcInstance.selfId,
			room: this.webrtcInstance.room,
			media: data.media,
			monitor: data.monitor
		});
	}

	joinCall(data) {
		this.log('WebRTCTransportClass - joinCall', this.webrtcInstance.room, this.webrtcInstance.selfId);
		if (data.monitor === true) {
			return RocketChat.Notifications.notifyUser(data.to, 'webrtc', 'join', {
				from: this.webrtcInstance.selfId,
				room: this.webrtcInstance.room,
				media: data.media,
				monitor: data.monitor
			});
		} else {
			return RocketChat.Notifications.notifyUsersOfRoom(this.webrtcInstance.room, 'webrtc', 'join', {
				from: this.webrtcInstance.selfId,
				room: this.webrtcInstance.room,
				media: data.media,
				monitor: data.monitor
			});
		}
	}

	sendCandidate(data) {
		data.from = this.webrtcInstance.selfId;
		data.room = this.webrtcInstance.room;
		this.log('WebRTCTransportClass - sendCandidate', data);
		return RocketChat.Notifications.notifyUser(data.to, 'webrtc', 'candidate', data);
	}

	sendDescription(data) {
		data.from = this.webrtcInstance.selfId;
		data.room = this.webrtcInstance.room;
		this.log('WebRTCTransportClass - sendDescription', data);
		return RocketChat.Notifications.notifyUser(data.to, 'webrtc', 'description', data);
	}

	sendStatus(data) {
		this.log('WebRTCTransportClass - sendStatus', data, this.webrtcInstance.room);
		data.from = this.webrtcInstance.selfId;
		return RocketChat.Notifications.notifyRoom(this.webrtcInstance.room, 'webrtc', 'status', data);
	}

	onRemoteCall(fn) {
		const callbacks = this.callbacks;
		if (callbacks['onRemoteCall'] == null) {
			callbacks['onRemoteCall'] = [];
		}
		return callbacks['onRemoteCall'].push(fn);
	}

	onRemoteJoin(fn) {
		const callbacks = this.callbacks;
		if (callbacks['onRemoteJoin'] == null) {
			callbacks['onRemoteJoin'] = [];
		}
		return callbacks['onRemoteJoin'].push(fn);
	}

	onRemoteCandidate(fn) {
		const callbacks = this.callbacks;
		if (callbacks['onRemoteCandidate'] == null) {
			callbacks['onRemoteCandidate'] = [];
		}
		return callbacks['onRemoteCandidate'].push(fn);
	}

	onRemoteDescription(fn) {
		const callbacks = this.callbacks;
		if (callbacks['onRemoteDescription'] == null) {
			callbacks['onRemoteDescription'] = [];
		}
		return callbacks['onRemoteDescription'].push(fn);
	}

	onRemoteStatus(fn) {
		const callbacks = this.callbacks;
		if (callbacks['onRemoteStatus'] == null) {
			callbacks['onRemoteStatus'] = [];
		}
		return callbacks['onRemoteStatus'].push(fn);
	}



}

class WebRTCClass {
  /*
  		@param seldId {String}
  		@param room {String}
   */

	constructor(selfId, room) {
		this.config = {
			iceServers: []
		};
		this.debug = false;
		this.TransportClass = WebRTCTransportClass;
		this.selfId = selfId;
		this.room = room;
		this.config.iceServers = [];
		let servers = RocketChat.settings.get('WebRTC_Servers');
		if (servers && servers.trim() !== '') {
			servers = servers.replace(/\s/g, '');
			servers = servers.split(',');

			servers.forEach((server) => {
				server = server.split('@');
				const serverConfig = {
					urls: server.pop()
				};
				if (server.length === 1) {
					server = server[0].split(':');
					serverConfig.username = decodeURIComponent(server[0]);
					serverConfig.credential = decodeURIComponent(server[1]);
				}
				this.config.iceServers.push(serverConfig);
			});
		}
		this.peerConnections = {};
		this.remoteItems = new ReactiveVar([]);
		this.remoteItemsById = new ReactiveVar({});
		this.callInProgress = new ReactiveVar(false);
		this.audioEnabled = new ReactiveVar(true);
		this.videoEnabled = new ReactiveVar(true);
		this.overlayEnabled = new ReactiveVar(false);
		this.screenShareEnabled = new ReactiveVar(false);
		this.localUrl = new ReactiveVar;
		this.active = false;
		this.remoteMonitoring = false;
		this.monitor = false;
		this.autoAccept = false;
		this.navigator = undefined;
		const userAgent = navigator.userAgent.toLocaleLowerCase();

		if (userAgent.indexOf('electron') !== -1) {
			this.navigator = 'electron';
		} else if (userAgent.indexOf('chrome') !== -1) {
			this.navigator = 'chrome';
		} else if (userAgent.indexOf('firefox') !== -1) {
			this.navigator = 'firefox';
		} else if (userAgent.indexOf('safari') !== -1) {
			this.navigator = 'safari';
		}
		const nav = this.navigator;
		this.screenShareAvailable = nav === 'chrome' || nav === 'firefox' || nav === 'electron';
		this.media = {
			video: false,
			audio: true
		};
		this.transport = new this.TransportClass(this);
		this.transport.onRemoteCall(this.onRemoteCall.bind(this));
		this.transport.onRemoteJoin(this.onRemoteJoin.bind(this));
		this.transport.onRemoteCandidate(this.onRemoteCandidate.bind(this));
		this.transport.onRemoteDescription(this.onRemoteDescription.bind(this));
		this.transport.onRemoteStatus(this.onRemoteStatus.bind(this));
		Meteor.setInterval(this.checkPeerConnections.bind(this), 1000);
	}

	log() {
		if (this.debug === true) {
			return console.log.apply(console, arguments);
		}
	}

	onError() {
		return console.error.apply(console, arguments);
	}

	checkPeerConnections() {
		const peerConnections = this.peerConnections;
		Object.keys(peerConnections).forEach((id) => {
			const peerConnection = peerConnections[id];
			if (peerConnection.iceConnectionState !== 'connected' && peerConnection.iceConnectionState !== 'completed' && peerConnection.createdAt + 5000 < Date.now()) {
				this.stopPeerConnection(id);
			}
		});
	}

	updateRemoteItems() {
		const items = [];
		const itemsById = {};
		const peerConnections = this.peerConnections;

		Object.keys(peerConnections).forEach((id) => {
			const peerConnection = peerConnections[id];
			console.log(peerConnection);
			// const remoteStreams = peerConnection.getRemoteStreams();

			peerConnection.getRemoteStreams().forEach((remoteStream) => {
				const item = {
					id,
					url: URL.createObjectURL(remoteStream),
					state: peerConnection.iceConnectionState
				};
				console.log(item);
				switch (peerConnection.iceConnectionState) {
					case 'checking':
						item.stateText = 'Connecting...';
						break;
					case 'connected':
					case 'completed':
						item.stateText = 'Connected';
						item.connected = true;
						break;
					case 'disconnected':
						item.stateText = 'Disconnected';
						break;
					case 'failed':
						item.stateText = 'Failed';
						break;
					case 'closed':
						item.stateText = 'Closed';
				}
				items.push(item);
				itemsById[id] = item;
			});
		});
		this.remoteItems.set(items);
		this.remoteItemsById.set(itemsById);
	}

	resetCallInProgress() {
		return this.callInProgress.set(false);
	}

	broadcastStatus() {
		if (this.active !== true || this.monitor === true || this.remoteMonitoring === true) {
			return;
		}
		const remoteConnections = [];
		const peerConnections = this.peerConnections;
		Object.keys(peerConnections).forEach((id) => {
			const peerConnection = peerConnections[id];
			remoteConnections.push({
				id,
				media: peerConnection.remoteMedia
			});
		});

		return this.transport.sendStatus({
			media: this.media,
			remoteConnections
		});
	}


  /*
  		@param data {Object}
  			from {String}
  			media {Object}
  			remoteConnections {Array[Object]}
  				id {String}
  				media {Object}
   */

	onRemoteStatus(data) {
		this.callInProgress.set(true);
		Meteor.clearTimeout(this.callInProgressTimeout);
		this.callInProgressTimeout = Meteor.setTimeout(this.resetCallInProgress.bind(this), 2000);
		if (this.active !== true) {
			return;
		}
		const remoteConnections = [{
			id: data.from,
			media: data.media
		},
			...data.remoteConnections];

		remoteConnections.forEach((remoteConnection) => {
			if (remoteConnection.id !== this.selfId && (this.peerConnections[remoteConnection.id] == null)) {
				this.log('reconnecting with', remoteConnection.id);
				this.onRemoteJoin({
					from: remoteConnection.id,
					media: remoteConnection.media
				});
			}
		});
	}


  /*
  		@param id {String}
   */

	getPeerConnection(id) {
		if (this.peerConnections[id] != null) {
			return this.peerConnections[id];
		}
		const peerConnection = new RTCPeerConnection(this.config);

		peerConnection.createdAt = Date.now();
		peerConnection.remoteMedia = {};
		this.peerConnections[id] = peerConnection;
		const eventNames = ['icecandidate', 'addstream', 'removestream', 'iceconnectionstatechange', 'datachannel', 'identityresult', 'idpassertionerror', 'idpvalidationerror', 'negotiationneeded', 'peeridentity', 'signalingstatechange'];

		eventNames.forEach((eventName) => {
			peerConnection.addEventListener(eventName, (e) => {
				this.log(id, e.type, e);
			});
		});

		peerConnection.addEventListener('icecandidate', (e) => {
			if (e.candidate == null) {
				return;
			}
			this.transport.sendCandidate({
				to: id,
				candidate: {
					candidate: e.candidate.candidate,
					sdpMLineIndex: e.candidate.sdpMLineIndex,
					sdpMid: e.candidate.sdpMid
				}
			});
		});
		peerConnection.addEventListener('addstream', () => {
			this.updateRemoteItems();
		});
		peerConnection.addEventListener('removestream', () => {
			this.updateRemoteItems();
		});
		peerConnection.addEventListener('iceconnectionstatechange', () => {
			let ref;
			if ((peerConnection.iceConnectionState === 'disconnected' || ref === 'closed') && peerConnection === this.peerConnections[id]) {
				this.stopPeerConnection(id);
				Meteor.setTimeout(() => {
					if (Object.keys(this.peerConnections).length === 0) {
						this.stop();
					}
				}, 3000);
			}
			this.updateRemoteItems();
		});
		return peerConnection;
	}

	_getUserMedia(media, onSuccess, onError) {
		const onSuccessLocal = function(stream) {
			if (AudioContext && stream.getAudioTracks().length > 0) {
				const audioContext = new AudioContext;
				const source = audioContext.createMediaStreamSource(stream);
				const volume = audioContext.createGain();
				source.connect(volume);
				const peer = audioContext.createMediaStreamDestination();
				volume.connect(peer);
				volume.gain.value = 0.6;
				stream.removeTrack(stream.getAudioTracks()[0]);
				stream.addTrack(peer.stream.getAudioTracks()[0]);
				stream.volume = volume;
				this.audioContext = audioContext;
			}
			return onSuccess(stream);
		};
		return navigator.getUserMedia(media, onSuccessLocal, onError);
	}

	getUserMedia(media, onSuccess, onError) {
		if (onError == null) {
			onError = this.onError;
		}
		if (media.desktop !== true) {
			this._getUserMedia(media, onSuccess, onError);
			return;
		}
		if (this.screenShareAvailable !== true) {
			console.log('Screen share is not avaliable');
			return;
		}
		const getScreen = (audioStream) => {
			if (document.cookie.indexOf('rocketchatscreenshare=chrome') === -1 && (window.rocketchatscreenshare == null) && this.navigator !== 'electron') {
				const refresh = function() {
					swal({
						type: 'warning',
						title: TAPi18n.__('Refresh_your_page_after_install_to_enable_screen_sharing')
					});
				};
				swal({
					type: 'warning',
					title: TAPi18n.__('Screen_Share'),
					text: TAPi18n.__('You_need_install_an_extension_to_allow_screen_sharing'),
					html: true,
					showCancelButton: true,
					confirmButtonText: TAPi18n.__('Install_Extension'),
					cancelButtonText: TAPi18n.__('Cancel')
				}, (isConfirm) => {
					if (isConfirm) {
						if (this.navigator === 'chrome') {
							chrome.webstore.install(undefined, refresh, function() {
								window.open('https://chrome.google.com/webstore/detail/rocketchat-screen-share/nocfbnnmjnndkbipkabodnheejiegccf');
								refresh();
							});
						} else if (this.navigator === 'firefox') {
							window.open('https://addons.mozilla.org/en-GB/firefox/addon/rocketchat-screen-share/');
							refresh();
						}
					}
				});
				return onError(false);
			}
			const getScreenSuccess = (stream) => {
				if (audioStream != null) {
					stream.addTrack(audioStream.getAudioTracks()[0]);
				}
				onSuccess(stream);
			};
			if (this.navigator === 'firefox') {
				media = {
					audio: media.audio,
					video: {
						mozMediaSource: 'window',
						mediaSource: 'window'
					}
				};
				this._getUserMedia(media, getScreenSuccess, onError);
			} else {
				ChromeScreenShare.getSourceId(this.navigator, (id) => {
					media = {
						audio: false,
						video: {
							mandatory: {
								chromeMediaSource: 'desktop',
								chromeMediaSourceId: id,
								maxWidth: 1280,
								maxHeight: 720
							}
						}
					};
					this._getUserMedia(media, getScreenSuccess, onError);
				});
			}
		};
		if (this.navigator === 'firefox' || (media.audio == null) || media.audio === false) {
			return getScreen();
		} else {
			const getAudioSuccess = (audioStream) => {
				return getScreen(audioStream);
			};
			const getAudioError = () => {
				getScreen();
			};

			this._getUserMedia({
				audio: media.audio
			}, getAudioSuccess, getAudioError);
		}
	}


  /*
  		@param callback {Function}
   */

	getLocalUserMedia(callback) {
		this.log('getLocalUserMedia', arguments);
		if (this.localStream != null) {
			return callback(null, this.localStream);
		}
		const onSuccess = (stream) => {
			this.localStream = stream;
			this.localUrl.set(URL.createObjectURL(stream));
			this.videoEnabled.set(this.media.video === true);
			this.audioEnabled.set(this.media.audio === true);
			const peerConnections = this.peerConnections;
			Object.keys(peerConnections).forEach((id) => {
				const peerConnection = peerConnections[id];
				peerConnection.addStream(stream);
			});
			return callback(null, this.localStream);
		};
		const onError = (error) => {
			callback(false);
			return this.onError(error);
		};
		return this.getUserMedia(this.media, onSuccess, onError);
	}


  /*
  		@param id {String}
   */

	stopPeerConnection(id) {
		const peerConnection = this.peerConnections[id];
		if (peerConnection == null) {
			return;
		}
		delete this.peerConnections[id];
		peerConnection.close();
		this.updateRemoteItems();
	}

	stopAllPeerConnections() {
		const peerConnections = this.peerConnections;

		Object.keys(peerConnections).forEach((id) => {
			this.stopPeerConnection(id);
		});

		window.audioContext && window.audioContext.close();
	}

	setAudioEnabled(enabled) {
		if (enabled == null) {
			enabled = true;
		}
		if (this.localStream != null) {
			if (enabled === true && this.media.audio !== true) {
				delete this.localStream;
				this.media.audio = true;
				return this.getLocalUserMedia(() => {
					this.stopAllPeerConnections();
					return this.joinCall();
				});
			} else {
				this.localStream.getAudioTracks().forEach(function(audio) {
					return audio.enabled = enabled;
				});
				return this.audioEnabled.set(enabled);
			}
		}
	}

	disableAudio() {
		return this.setAudioEnabled(false);
	}

	enableAudio() {
		return this.setAudioEnabled(true);
	}

	setVideoEnabled(enabled) {
		if (enabled == null) {
			enabled = true;
		}
		if (this.localStream != null) {
			if (enabled === true && this.media.video !== true) {
				delete this.localStream;
				this.media.video = true;
				return this.getLocalUserMedia(() => {
					this.stopAllPeerConnections();
					return this.joinCall();
				});
			} else {
				this.localStream.getVideoTracks().forEach(function(video) {
					return video.enabled = enabled;
				});
				return this.videoEnabled.set(enabled);
			}
		}
	}

	disableScreenShare() {
		return this.setScreenShareEnabled(false);
	}

	enableScreenShare() {
		return this.setScreenShareEnabled(true);
	}

	setScreenShareEnabled(enabled) {
		if (enabled == null) {
			enabled = true;
		}
		if (this.localStream != null) {
			this.media.desktop = enabled;
			delete this.localStream;
			return this.getLocalUserMedia((err) => {
				if (err != null) {
					return;
				}
				this.screenShareEnabled.set(enabled);
				this.stopAllPeerConnections();
				return this.joinCall();
			});
		}
	}

	disableVideo() {
		return this.setVideoEnabled(false);
	}

	enableVideo() {
		return this.setVideoEnabled(true);
	}

	stop() {
		this.active = false;
		this.monitor = false;
		this.remoteMonitoring = false;
		if ((this.localStream != null) && typeof this.localStream !== 'undefined') {
			this.localStream.getTracks().forEach(function(track) {
				return track.stop();
			});
		}
		this.localUrl.set(undefined);
		delete this.localStream;
		return this.stopAllPeerConnections();
	}


  /*
  		@param media {Object}
  			audio {Boolean}
  			video {Boolean}
   */

	startCall(media) {
		if (media == null) {
			media = {};
		}
		this.log('startCall', arguments);
		this.media = media;
		return this.getLocalUserMedia(() => {
			this.active = true;
			return this.transport.startCall({
				media: this.media
			});
		});
	}

	startCallAsMonitor(media) {
		if (media == null) {
			media = {};
		}
		this.log('startCallAsMonitor', arguments);
		this.media = media;
		this.active = true;
		this.monitor = true;
		return this.transport.startCall({
			media: this.media,
			monitor: true
		});
	}


  /*
  		@param data {Object}
  			from {String}
  			monitor {Boolean}
  			media {Object}
  				audio {Boolean}
  				video {Boolean}
   */

	onRemoteCall(data) {
		if (this.autoAccept === true) {
			FlowRouter.goToRoomById(data.room);
			Meteor.defer(() => {
				return this.joinCall({
					to: data.from,
					monitor: data.monitor,
					media: data.media
				});
			});
			return;
		}

		const user = Meteor.users.findOne(data.from);
		let fromUsername = undefined;
		if (user && user.username) {
			fromUsername = user.username;
		}
		const subscription = ChatSubscription.findOne({
			rid: data.room
		});

		let icon;
		let title;
		if (data.monitor === true) {
			icon = 'eye';
			title = `Monitor call from ${ fromUsername }`;
		} else if (subscription && subscription.t === 'd') {
			if (data.media && data.media.video) {
				icon = 'videocam';
				title = `Direct video call from ${ fromUsername }`;
			} else {
				icon = 'phone';
				title = `Direct audio call from ${ fromUsername }`;
			}
		} else if (data.media && data.media.video) {
			icon = 'videocam';
			title = `Group video call from ${ subscription.name }`;
		} else {
			icon = 'phone';
			title = `Group audio call from ${ subscription.name }`;
		}
		return swal({
			title: `<i class='icon-${ icon } alert-icon success-color'></i>${ title }`,
			text: 'Do you want to accept?',
			html: true,
			showCancelButton: true,
			confirmButtonText: 'Yes',
			cancelButtonText: 'No'
		}, (isConfirm) => {
			if (isConfirm) {
				FlowRouter.goToRoomById(data.room);
				return Meteor.defer(() => {
					return this.joinCall({
						to: data.from,
						monitor: data.monitor,
						media: data.media
					});
				});
			} else {
				return this.stop();
			}
		});
	}


  /*
  		@param data {Object}
  			to {String}
  			monitor {Boolean}
  			media {Object}
  				audio {Boolean}
  				video {Boolean}
  				desktop {Boolean}
   */

	joinCall(data) {
		if (data == null) {
			data = {};
		}
		if (data.media && data.media.audio) {
			this.media.audio = data.media.audio;
		}
		if (data.media && data.media.video) {
			this.media.video = data.media.video;
		}
		data.media = this.media;
		this.log('joinCall', arguments);
		this.getLocalUserMedia(() => {
			this.remoteMonitoring = data.monitor;
			this.active = true;
			this.transport.joinCall(data);
		});
	}


	onRemoteJoin(data) {
		if (this.active !== true) {
			return;
		}
		this.log('onRemoteJoin', arguments);
		let peerConnection = this.getPeerConnection(data.from);
		if (peerConnection.signalingState !== 'checking') {
			this.stopPeerConnection(data.from);
			peerConnection = this.getPeerConnection(data.from);
		}
		if (peerConnection.iceConnectionState !== 'new') {
			return;
		}
		peerConnection.remoteMedia = data.media;
		if (this.localStream) {
			peerConnection.addStream(this.localStream);
		}
		const onOffer = offer => {
			const onLocalDescription = () => {
				return this.transport.sendDescription({
					to: data.from,
					type: 'offer',
					ts: peerConnection.createdAt,
					media: this.media,
					description: {
						sdp: offer.sdp,
						type: offer.type
					}
				});
			};

			return peerConnection.setLocalDescription(new RTCSessionDescription(offer), onLocalDescription, this.onError);
		};

		if (data.monitor === true) {
			return peerConnection.createOffer(onOffer, this.onError, {
				mandatory: {
					OfferToReceiveAudio: data.media.audio,
					OfferToReceiveVideo: data.media.video
				}
			});
		} else {
			return peerConnection.createOffer(onOffer, this.onError);
		}
	}



	onRemoteOffer(data) {
		if (this.active !== true) { return; }

		this.log('onRemoteOffer', arguments);
		let peerConnection = this.getPeerConnection(data.from);

		if (['have-local-offer', 'stable'].includes(peerConnection.signalingState) && (peerConnection.createdAt < data.ts)) {
			this.stopPeerConnection(data.from);
			peerConnection = this.getPeerConnection(data.from);
		}

		if (peerConnection.iceConnectionState !== 'new') {
			return;
		}

		peerConnection.setRemoteDescription(new RTCSessionDescription(data.description));

		try {
			if (this.localStream) {
				peerConnection.addStream(this.localStream);
			}
		} catch (error) {
			console.log(error);
		}

		const onAnswer = answer => {
			const onLocalDescription = () => {
				return this.transport.sendDescription({
					to: data.from,
					type: 'answer',
					ts: peerConnection.createdAt,
					description: {
						sdp: answer.sdp,
						type: answer.type
					}
				});
			};

			return peerConnection.setLocalDescription(new RTCSessionDescription(answer), onLocalDescription, this.onError);
		};

		return peerConnection.createAnswer(onAnswer, this.onError);
	}


  /*
  		@param data {Object}
  			to {String}
  			from {String}
  			candidate {RTCIceCandidate JSON encoded}
   */

	onRemoteCandidate(data) {
		if (this.active !== true) {
			return;
		}
		if (data.to !== this.selfId) {
			return;
		}
		this.log('onRemoteCandidate', arguments);
		const peerConnection = this.getPeerConnection(data.from);
		if (peerConnection.iceConnectionState !== 'closed' && peerConnection.iceConnectionState !== 'failed' && peerConnection.iceConnectionState !== 'disconnected' && peerConnection.iceConnectionState !== 'completed') {
			return peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
		}
	}


  /*
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
   */

	onRemoteDescription(data) {
		if (this.active !== true) {
			return;
		}
		if (data.to !== this.selfId) {
			return;
		}
		this.log('onRemoteDescription', arguments);
		const peerConnection = this.getPeerConnection(data.from);
		if (data.type === 'offer') {
			peerConnection.remoteMedia = data.media;
			return this.onRemoteOffer({
				from: data.from,
				ts: data.ts,
				description: data.description
			});
		} else {
			return peerConnection.setRemoteDescription(new RTCSessionDescription(data.description));
		}
	}

}

const WebRTC = new class {
	constructor() {
		this.instancesByRoomId = {};
	}

	getInstanceByRoomId(roomId) {
		const subscription = ChatSubscription.findOne({
			rid: roomId
		});
		if (!subscription) {
			return;
		}
		let enabled = false;
		switch (subscription.t) {
			case 'd':
				enabled = RocketChat.settings.get('WebRTC_Enable_Direct');
				break;
			case 'p':
				enabled = RocketChat.settings.get('WebRTC_Enable_Private');
				break;
			case 'c':
				enabled = RocketChat.settings.get('WebRTC_Enable_Channel');
		}
		if (enabled === false) {
			return;
		}
		if (this.instancesByRoomId[roomId] == null) {
			this.instancesByRoomId[roomId] = new WebRTCClass(Meteor.userId(), roomId);
		}
		return this.instancesByRoomId[roomId];
	}
};

Meteor.startup(function() {
	return Tracker.autorun(function() {
		if (Meteor.userId()) {
			return RocketChat.Notifications.onUser('webrtc', (type, data) => {
				if (data.room == null) {
					return;
				}
				const webrtc = WebRTC.getInstanceByRoomId(data.room);
				return webrtc.transport.onUserStream(type, data);
			});
		}
	});
});

export {WebRTC};
