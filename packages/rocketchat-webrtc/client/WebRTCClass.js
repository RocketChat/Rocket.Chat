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
						onRemoteStatus.forEach(fn => fn(data));
					}
			}
		});
	}

	log() {
		if (this.debug === true) {
			console.log.apply(console, arguments);
		}
	}

	onUserStream(type, data) {
		if (data.room !== this.webrtcInstance.room) {
			return;
		}
		this.log('WebRTCTransportClass - onUser', type, data);
		const onRemoteCall = this.callbacks['onRemoteCall'];
		const onRemoteJoin = this.callbacks['onRemoteJoin'];
		const onRemoteCandidate = this.callbacks['onRemoteCandidate'];
		const onRemoteDescription = this.callbacks['onRemoteDescription'];

		switch (type) {
			case 'call':
				if (onRemoteCall && onRemoteCall.length) {
					onRemoteCall.forEach(fn => fn(data));
				}
				break;
			case 'join':
				if (onRemoteJoin && onRemoteJoin.length) {
					onRemoteJoin.forEach(fn => fn(data));
				}
				break;
			case 'candidate':
				if (onRemoteCandidate && onRemoteCandidate.length) {
					onRemoteCandidate.forEach(fn => fn(data));
				}
				break;
			case 'description':
				if (onRemoteDescription && onRemoteDescription.length) {
					onRemoteDescription.forEach(fn => fn(data));
				}
		}
	}

	startCall(data) {
		this.log('WebRTCTransportClass - startCall', this.webrtcInstance.room, this.webrtcInstance.selfId);
		RocketChat.Notifications.notifyUsersOfRoom(this.webrtcInstance.room, 'webrtc', 'call', {
			from: this.webrtcInstance.selfId,
			room: this.webrtcInstance.room,
			media: data.media,
			monitor: data.monitor
		});
	}

	joinCall(data) {
		this.log('WebRTCTransportClass - joinCall', this.webrtcInstance.room, this.webrtcInstance.selfId);
		if (data.monitor === true) {
			RocketChat.Notifications.notifyUser(data.to, 'webrtc', 'join', {
				from: this.webrtcInstance.selfId,
				room: this.webrtcInstance.room,
				media: data.media,
				monitor: data.monitor
			});
		} else {
			RocketChat.Notifications.notifyUsersOfRoom(this.webrtcInstance.room, 'webrtc', 'join', {
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
		RocketChat.Notifications.notifyUser(data.to, 'webrtc', 'candidate', data);
	}

	sendDescription(data) {
		data.from = this.webrtcInstance.selfId;
		data.room = this.webrtcInstance.room;
		this.log('WebRTCTransportClass - sendDescription', data);
		RocketChat.Notifications.notifyUser(data.to, 'webrtc', 'description', data);
	}

	sendStatus(data) {
		this.log('WebRTCTransportClass - sendStatus', data, this.webrtcInstance.room);
		data.from = this.webrtcInstance.selfId;
		RocketChat.Notifications.notifyRoom(this.webrtcInstance.room, 'webrtc', 'status', data);
	}

	onRemoteCall(fn) {
		const callbacks = this.callbacks;
		if (callbacks['onRemoteCall'] == null) {
			callbacks['onRemoteCall'] = [];
		}
		callbacks['onRemoteCall'].push(fn);
	}

	onRemoteJoin(fn) {
		const callbacks = this.callbacks;
		if (callbacks['onRemoteJoin'] == null) {
			callbacks['onRemoteJoin'] = [];
		}
		callbacks['onRemoteJoin'].push(fn);
	}

	onRemoteCandidate(fn) {
		const callbacks = this.callbacks;
		if (callbacks['onRemoteCandidate'] == null) {
			callbacks['onRemoteCandidate'] = [];
		}
		callbacks['onRemoteCandidate'].push(fn);
	}

	onRemoteDescription(fn) {
		const callbacks = this.callbacks;
		if (callbacks['onRemoteDescription'] == null) {
			callbacks['onRemoteDescription'] = [];
		}
		callbacks['onRemoteDescription'].push(fn);
	}

	onRemoteStatus(fn) {
		const callbacks = this.callbacks;
		if (callbacks['onRemoteStatus'] == null) {
			callbacks['onRemoteStatus'] = [];
		}
		callbacks['onRemoteStatus'].push(fn);
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
		let servers = RocketChat.settings.get('WebRTC_Servers');
		if (servers && servers.trim() !== '') {
			servers = servers.replace(/\s/g, '');
			servers = servers.split(',');

			servers.forEach(server => {
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

		//Meteor.setInterval(this.broadcastStatus.bind(@), 1000);
	}

	log() {
		if (this.debug === true) {
			console.log.apply(console, arguments);
		}
	}

	onError() {
		console.error.apply(console, arguments);
	}

	checkPeerConnections() {
		const peerConnections = this.peerConnections;
		Object.keys(peerConnections).forEach(id => {
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

		Object.keys(peerConnections).forEach(id => {
			const peerConnection = peerConnections[id];

			peerConnection.getRemoteStreams().forEach(remoteStream => {
				const item = {
					id,
					url: URL.createObjectURL(remoteStream),
					state: peerConnection.iceConnectionState
				};
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
		this.callInProgress.set(false);
	}

	broadcastStatus() {
		if (this.active !== true || this.monitor === true || this.remoteMonitoring === true) {
			return;
		}
		const remoteConnections = [];
		const peerConnections = this.peerConnections;
		Object.keys(peerConnections).forEach(id => {
			const peerConnection = peerConnections[id];
			remoteConnections.push({
				id,
				media: peerConnection.remoteMedia
			});
		});

		this.transport.sendStatus({
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
		//this.log(onRemoteStatus, arguments);
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

		remoteConnections.forEach(remoteConnection => {
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

		eventNames.forEach(eventName => {
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
			if ((peerConnection.iceConnectionState === 'disconnected' || peerConnection.iceConnectionState === 'closed') && peerConnection === this.peerConnections[id]) {
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
			onSuccess(stream);
		};
		navigator.getUserMedia(media, onSuccessLocal, onError);
	}

	getUserMedia(media, onSuccess, onError = this.onError) {
		if (media.desktop !== true) {
			this._getUserMedia(media, onSuccess, onError);
			return;
		}
		if (this.screenShareAvailable !== true) {
			console.log('Screen share is not avaliable');
			return;
		}
		const getScreen = (audioStream) => {
			const refresh = function() {
				swal({
					type: 'warning',
					title: TAPi18n.__('Refresh_your_page_after_install_to_enable_screen_sharing')
				});
			};

			const isChromeExtensionInstalled = this.navigator === 'chrome' && ChromeScreenShare.installed;
			const isFirefoxExtensionInstalled = this.navigator === 'firefox' && window.rocketchatscreenshare != null;

			if (!isChromeExtensionInstalled && !isFirefoxExtensionInstalled) {
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
							const url = 'https://chrome.google.com/webstore/detail/rocketchat-screen-share/nocfbnnmjnndkbipkabodnheejiegccf';
							try {
								chrome.webstore.install(url, refresh, function() {
									window.open(url);
									refresh();
								});
							} catch (_error) {
								console.log(_error);
								window.open(url);
								refresh();
							}
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
			getScreen();
		} else {
			const getAudioSuccess = (audioStream) => {
				getScreen(audioStream);
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
			Object.keys(peerConnections).forEach(id => {
				const peerConnection = peerConnections[id];
				peerConnection.addStream(stream);
			});
			callback(null, this.localStream);
		};
		const onError = (error) => {
			callback(false);
			this.onError(error);
		};
		this.getUserMedia(this.media, onSuccess, onError);
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

		Object.keys(peerConnections).forEach(id => {
			this.stopPeerConnection(id);
		});

		window.audioContext && window.audioContext.close();
	}

	setAudioEnabled(enabled = true) {
		if (this.localStream != null) {
			if (enabled === true && this.media.audio !== true) {
				delete this.localStream;
				this.media.audio = true;
				this.getLocalUserMedia(() => {
					this.stopAllPeerConnections();
					this.joinCall();
				});
			} else {
				this.localStream.getAudioTracks().forEach(function(audio) {
					audio.enabled = enabled;
				});
				this.audioEnabled.set(enabled);
			}
		}
	}

	disableAudio() {
		this.setAudioEnabled(false);
	}

	enableAudio() {
		this.setAudioEnabled(true);
	}

	setVideoEnabled(enabled = true) {
		if (this.localStream != null) {
			if (enabled === true && this.media.video !== true) {
				delete this.localStream;
				this.media.video = true;
				this.getLocalUserMedia(() => {
					this.stopAllPeerConnections();
					this.joinCall();
				});
			} else {
				this.localStream.getVideoTracks().forEach(function(video) {
					video.enabled = enabled;
				});
				this.videoEnabled.set(enabled);
			}
		}
	}

	disableScreenShare() {
		this.setScreenShareEnabled(false);
	}

	enableScreenShare() {
		this.setScreenShareEnabled(true);
	}

	setScreenShareEnabled(enabled = true) {
		if (this.localStream != null) {
			this.media.desktop = enabled;
			delete this.localStream;
			this.getLocalUserMedia(err => {
				if (err != null) {
					return;
				}
				this.screenShareEnabled.set(enabled);
				this.stopAllPeerConnections();
				this.joinCall();
			});
		}
	}

	disableVideo() {
		this.setVideoEnabled(false);
	}

	enableVideo() {
		this.setVideoEnabled(true);
	}

	stop() {
		this.active = false;
		this.monitor = false;
		this.remoteMonitoring = false;
		if (this.localStream != null && typeof this.localStream !== 'undefined') {
			this.localStream.getTracks().forEach(track => track.stop());
		}
		this.localUrl.set(undefined);
		delete this.localStream;
		this.stopAllPeerConnections();
	}


	/*
  		@param media {Object}
  			audio {Boolean}
  			video {Boolean}
   */

	startCall(media = {}) {
		this.log('startCall', arguments);
		this.media = media;
		this.getLocalUserMedia(() => {
			this.active = true;
			this.transport.startCall({
				media: this.media
			});
		});
	}

	startCallAsMonitor(media = {}) {
		this.log('startCallAsMonitor', arguments);
		this.media = media;
		this.active = true;
		this.monitor = true;
		this.transport.startCall({
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
				this.joinCall({
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
		swal({
			title: `<i class='icon-${ icon } alert-icon success-color'></i>${ title }`,
			text: 'Do you want to accept?',
			html: true,
			showCancelButton: true,
			confirmButtonText: 'Yes',
			cancelButtonText: 'No'
		}, (isConfirm) => {
			if (isConfirm) {
				FlowRouter.goToRoomById(data.room);
				Meteor.defer(() => {
					this.joinCall({
						to: data.from,
						monitor: data.monitor,
						media: data.media
					});
				});
			} else {
				this.stop();
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

	joinCall(data = {}) {
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

		// needsRefresh = false
		// if peerConnection.iceConnectionState isnt 'new'
		// needsAudio = data.media.audio is true and peerConnection.remoteMedia.audio isnt true
		// needsVideo = data.media.video is true and peerConnection.remoteMedia.video isnt true
		// needsRefresh = needsAudio or needsVideo or data.media.desktop isnt peerConnection.remoteMedia.desktop

		// # if peerConnection.signalingState is "have-local-offer" or needsRefresh

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
				this.transport.sendDescription({
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

			peerConnection.setLocalDescription(new RTCSessionDescription(offer), onLocalDescription, this.onError);
		};

		if (data.monitor === true) {
			peerConnection.createOffer(onOffer, this.onError, {
				mandatory: {
					OfferToReceiveAudio: data.media.audio,
					OfferToReceiveVideo: data.media.video
				}
			});
		} else {
			peerConnection.createOffer(onOffer, this.onError);
		}
	}



	onRemoteOffer(data) {
		if (this.active !== true) {
			return;
		}

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
				this.transport.sendDescription({
					to: data.from,
					type: 'answer',
					ts: peerConnection.createdAt,
					description: {
						sdp: answer.sdp,
						type: answer.type
					}
				});
			};

			peerConnection.setLocalDescription(new RTCSessionDescription(answer), onLocalDescription, this.onError);
		};

		peerConnection.createAnswer(onAnswer, this.onError);
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
			peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
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
			this.onRemoteOffer({
				from: data.from,
				ts: data.ts,
				description: data.description
			});
		} else {
			peerConnection.setRemoteDescription(new RTCSessionDescription(data.description));
		}
	}

}

const WebRTC = new class {
	constructor() {
		this.instancesByRoomId = {};
	}

	getInstanceByRoomId(roomId) {
		const subscription = ChatSubscription.findOne({ rid: roomId });
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
	Tracker.autorun(function() {
		if (Meteor.userId()) {
			RocketChat.Notifications.onUser('webrtc', (type, data) => {
				if (data.room == null) {
					return;
				}
				const webrtc = WebRTC.getInstanceByRoomId(data.room);
				webrtc.transport.onUserStream(type, data);
			});
		}
	});
});

export {WebRTC};
