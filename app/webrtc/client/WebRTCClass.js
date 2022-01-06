import { Emitter } from '@rocket.chat/emitter';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { ChromeScreenShare } from './screenShare';
import { t } from '../../utils';
import { Notifications } from '../../notifications';
import { settings } from '../../settings';
import { modal } from '../../ui-utils';
import { ChatSubscription } from '../../models';
import { WEB_RTC_EVENTS } from '..';
import { goToRoomById } from '../../../client/lib/utils/goToRoomById';

class WebRTCTransportClass extends Emitter {
	constructor(webrtcInstance) {
		super();
		this.debug = false;
		this.webrtcInstance = webrtcInstance;
		Notifications.onRoom(this.webrtcInstance.room, WEB_RTC_EVENTS.WEB_RTC, (type, data) => {
			this.log('WebRTCTransportClass - onRoom', type, data);
			this.emit(type, data);
		});
	}

	log(...args) {
		if (this.debug === true) {
			console.log(...args);
		}
	}

	onUserStream(type, data) {
		if (data.room !== this.webrtcInstance.room) {
			return;
		}

		this.log('WebRTCTransportClass - onUser', type, data);
		this.emit(type, data);
	}

	startCall(data) {
		this.log('WebRTCTransportClass - startCall', this.webrtcInstance.room, this.webrtcInstance.selfId);
		Notifications.notifyUsersOfRoom(this.webrtcInstance.room, WEB_RTC_EVENTS.WEB_RTC, WEB_RTC_EVENTS.CALL, {
			from: this.webrtcInstance.selfId,
			room: this.webrtcInstance.room,
			media: data.media,
			monitor: data.monitor,
		});
	}

	joinCall(data) {
		this.log('WebRTCTransportClass - joinCall', this.webrtcInstance.room, this.webrtcInstance.selfId);
		if (data.monitor === true) {
			Notifications.notifyUser(data.to, WEB_RTC_EVENTS.WEB_RTC, WEB_RTC_EVENTS.JOIN, {
				from: this.webrtcInstance.selfId,
				room: this.webrtcInstance.room,
				media: data.media,
				monitor: data.monitor,
			});
		} else {
			Notifications.notifyUsersOfRoom(this.webrtcInstance.room, WEB_RTC_EVENTS.WEB_RTC, WEB_RTC_EVENTS.JOIN, {
				from: this.webrtcInstance.selfId,
				room: this.webrtcInstance.room,
				media: data.media,
				monitor: data.monitor,
			});
		}
	}

	sendCandidate(data) {
		data.from = this.webrtcInstance.selfId;
		data.room = this.webrtcInstance.room;
		this.log('WebRTCTransportClass - sendCandidate', data);
		Notifications.notifyUser(data.to, WEB_RTC_EVENTS.WEB_RTC, WEB_RTC_EVENTS.CANDIDATE, data);
	}

	sendDescription(data) {
		data.from = this.webrtcInstance.selfId;
		data.room = this.webrtcInstance.room;
		this.log('WebRTCTransportClass - sendDescription', data);
		Notifications.notifyUser(data.to, WEB_RTC_EVENTS.WEB_RTC, WEB_RTC_EVENTS.DESCRIPTION, data);
	}

	sendStatus(data) {
		this.log('WebRTCTransportClass - sendStatus', data, this.webrtcInstance.room);
		data.from = this.webrtcInstance.selfId;
		Notifications.notifyRoom(this.webrtcInstance.room, WEB_RTC_EVENTS.WEB_RTC, WEB_RTC_EVENTS.STATUS, data);
	}

	onRemoteCall(fn) {
		return this.on(WEB_RTC_EVENTS.CALL, fn);
	}

	onRemoteJoin(fn) {
		return this.on(WEB_RTC_EVENTS.JOIN, fn);
	}

	onRemoteCandidate(fn) {
		return this.on(WEB_RTC_EVENTS.CANDIDATE, fn);
	}

	onRemoteDescription(fn) {
		return this.on(WEB_RTC_EVENTS.DESCRIPTION, fn);
	}

	onRemoteStatus(fn) {
		return this.on(WEB_RTC_EVENTS.STATUS, fn);
	}
}

class WebRTCClass {
	/*
  		@param seldId {String}
  		@param room {String}
   */

	constructor(selfId, room, autoAccept = false) {
		this.config = {
			iceServers: [],
		};
		this.debug = false;
		this.TransportClass = WebRTCTransportClass;
		this.selfId = selfId;
		this.room = room;
		let servers = settings.get('WebRTC_Servers');
		if (servers && servers.trim() !== '') {
			servers = servers.replace(/\s/g, '');
			servers = servers.split(',');

			servers.forEach((server) => {
				server = server.split('@');
				const serverConfig = {
					urls: server.pop(),
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
		this.audioEnabled = new ReactiveVar(false);
		this.videoEnabled = new ReactiveVar(false);
		this.overlayEnabled = new ReactiveVar(false);
		this.screenShareEnabled = new ReactiveVar(false);
		this.localUrl = new ReactiveVar();
		this.active = false;
		this.remoteMonitoring = false;
		this.monitor = false;
		this.autoAccept = autoAccept;
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

		this.screenShareAvailable = ['chrome', 'firefox', 'electron'].includes(this.navigator);
		this.media = {
			video: true,
			audio: true,
		};
		this.transport = new this.TransportClass(this);
		this.transport.onRemoteCall(this.onRemoteCall.bind(this));
		this.transport.onRemoteJoin(this.onRemoteJoin.bind(this));
		this.transport.onRemoteCandidate(this.onRemoteCandidate.bind(this));
		this.transport.onRemoteDescription(this.onRemoteDescription.bind(this));
		this.transport.onRemoteStatus(this.onRemoteStatus.bind(this));

		Meteor.setInterval(this.checkPeerConnections.bind(this), 1000);

		// Meteor.setInterval(this.broadcastStatus.bind(@), 1000);
	}

	onUserStream(...args) {
		return this.transport.onUserStream(...args);
	}

	log(...args) {
		if (this.debug === true) {
			console.log.apply(console, args);
		}
	}

	onError(...args) {
		console.error.apply(console, args);
	}

	checkPeerConnections() {
		const { peerConnections } = this;
		const date = Date.now();
		Object.entries(peerConnections).some(([id, peerConnection]) => {
			if (!['connected', 'completed'].includes(peerConnection.iceConnectionState) && peerConnection.createdAt + 5000 < date) {
				this.stopPeerConnection(id);
				return true;
			}
			return false;
		});
	}

	updateRemoteItems() {
		const items = [];
		const itemsById = {};
		const { peerConnections } = this;

		Object.entries(peerConnections).forEach(([id, peerConnection]) => {
			peerConnection.getRemoteStreams().forEach((remoteStream) => {
				const item = {
					id,
					url: remoteStream,
					state: peerConnection.iceConnectionState,
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

	resetCallInProgress = () => {
		this.callInProgress.set(false);
	};

	broadcastStatus() {
		if (this.active !== true || this.monitor === true || this.remoteMonitoring === true) {
			return;
		}
		const remoteConnections = [];
		const { peerConnections } = this;
		Object.keys(peerConnections).entries(([id, { remoteMedia: media }]) => {
			remoteConnections.push({
				id,
				media,
			});
		});

		this.transport.sendStatus({
			media: this.media,
			remoteConnections,
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
		// this.log(onRemoteStatus, arguments);
		this.callInProgress.set(true);
		Meteor.clearTimeout(this.callInProgressTimeout);
		this.callInProgressTimeout = Meteor.setTimeout(this.resetCallInProgress, 2000);
		if (this.active !== true) {
			return;
		}
		const remoteConnections = [
			{
				id: data.from,
				media: data.media,
			},
			...data.remoteConnections,
		];

		remoteConnections.forEach((remoteConnection) => {
			if (remoteConnection.id !== this.selfId && this.peerConnections[remoteConnection.id] == null) {
				this.log('reconnecting with', remoteConnection.id);
				this.onRemoteJoin({
					from: remoteConnection.id,
					media: remoteConnection.media,
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
		const eventNames = [
			'icecandidate',
			'addstream',
			'removestream',
			'iceconnectionstatechange',
			'datachannel',
			'identityresult',
			'idpassertionerror',
			'idpvalidationerror',
			'negotiationneeded',
			'peeridentity',
			'signalingstatechange',
		];

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
					sdpMid: e.candidate.sdpMid,
				},
			});
		});
		peerConnection.addEventListener('addstream', () => {
			this.updateRemoteItems();
		});
		peerConnection.addEventListener('removestream', () => {
			this.updateRemoteItems();
		});
		peerConnection.addEventListener('iceconnectionstatechange', () => {
			if (
				(peerConnection.iceConnectionState === 'disconnected' || peerConnection.iceConnectionState === 'closed') &&
				peerConnection === this.peerConnections[id]
			) {
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
		const onSuccessLocal = (stream) => {
			if (AudioContext && stream.getAudioTracks().length > 0) {
				const audioContext = new AudioContext();
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
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			return navigator.mediaDevices.getUserMedia(media).then(onSuccessLocal).catch(onError);
		}

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
			const refresh = function () {
				modal.open({
					type: 'warning',
					title: TAPi18n.__('Refresh_your_page_after_install_to_enable_screen_sharing'),
				});
			};

			const isChromeExtensionInstalled = this.navigator === 'chrome' && ChromeScreenShare.installed;
			const isFirefoxExtensionInstalled = this.navigator === 'firefox' && window.rocketchatscreenshare != null;

			if (!isChromeExtensionInstalled && !isFirefoxExtensionInstalled) {
				modal.open(
					{
						type: 'warning',
						title: TAPi18n.__('Screen_Share'),
						text: TAPi18n.__('You_need_install_an_extension_to_allow_screen_sharing'),
						html: true,
						showCancelButton: true,
						confirmButtonText: TAPi18n.__('Install_Extension'),
						cancelButtonText: TAPi18n.__('Cancel'),
					},
					(isConfirm) => {
						if (isConfirm) {
							if (this.navigator === 'chrome') {
								const url = 'https://chrome.google.com/webstore/detail/rocketchat-screen-share/nocfbnnmjnndkbipkabodnheejiegccf';
								try {
									chrome.webstore.install(url, refresh, function () {
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
					},
				);
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
						mediaSource: 'window',
					},
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
								maxHeight: 720,
							},
						},
					};
					this._getUserMedia(media, getScreenSuccess, onError);
				});
			}
		};
		if (this.navigator === 'firefox' || media.audio == null || media.audio === false) {
			getScreen();
		} else {
			const getAudioSuccess = (audioStream) => {
				getScreen(audioStream);
			};
			const getAudioError = () => {
				getScreen();
			};

			this._getUserMedia(
				{
					audio: media.audio,
				},
				getAudioSuccess,
				getAudioError,
			);
		}
	}

	/*
  		@param callback {Function}
   */

	getLocalUserMedia(callback, ...args) {
		this.log('getLocalUserMedia', [callback, ...args]);
		if (this.localStream != null) {
			return callback(null, this.localStream);
		}
		const onSuccess = (stream) => {
			this.localStream = stream;
			!this.audioEnabled.get() && this.disableAudio();
			!this.videoEnabled.get() && this.disableVideo();
			this.localUrl.set(stream);
			const { peerConnections } = this;
			Object.entries(peerConnections).forEach(([, peerConnection]) => peerConnection.addStream(stream));
			document.querySelector('video#localVideo').srcObject = stream;
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

	stopPeerConnection = (id) => {
		const peerConnection = this.peerConnections[id];
		if (peerConnection == null) {
			return;
		}
		delete this.peerConnections[id];
		peerConnection.close();
		this.updateRemoteItems();
	};

	stopAllPeerConnections() {
		const { peerConnections } = this;

		Object.keys(peerConnections).forEach(this.stopPeerConnection);

		window.audioContext && window.audioContext.close();
	}

	setAudioEnabled(enabled = true) {
		if (this.localStream != null) {
			this.localStream.getAudioTracks().forEach(function (audio) {
				audio.enabled = enabled;
			});
			this.audioEnabled.set(enabled);
		}
	}

	disableAudio() {
		this.setAudioEnabled(false);
	}

	enableAudio() {
		this.setAudioEnabled(true);
	}

	toggleAudio() {
		if (this.audioEnabled.get()) {
			return this.disableAudio();
		}
		return this.enableAudio();
	}

	setVideoEnabled(enabled = true) {
		if (this.localStream != null) {
			this.localStream.getVideoTracks().forEach(function (video) {
				video.enabled = enabled;
			});
			this.videoEnabled.set(enabled);
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
			this.getLocalUserMedia((err) => {
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

	toggleVideo() {
		if (this.videoEnabled.get()) {
			return this.disableVideo();
		}
		return this.enableVideo();
	}

	stop() {
		this.active = false;
		this.monitor = false;
		this.remoteMonitoring = false;
		if (this.localStream != null && typeof this.localStream !== 'undefined') {
			this.localStream.getTracks().forEach((track) => track.stop());
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

	startCall(media = {}, ...args) {
		this.log('startCall', [media, ...args]);
		this.media = media;
		this.getLocalUserMedia(() => {
			this.active = true;
			this.transport.startCall({
				media: this.media,
			});
		});
	}

	startCallAsMonitor(media = {}, ...args) {
		this.log('startCallAsMonitor', [media, ...args]);
		this.media = media;
		this.active = true;
		this.monitor = true;
		this.transport.startCall({
			media: this.media,
			monitor: true,
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
			Meteor.defer(() => {
				this.joinCall({
					to: data.from,
					monitor: data.monitor,
					media: data.media,
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
			rid: data.room,
		});

		let icon;
		let title;
		if (data.monitor === true) {
			icon = 'eye';
			title = t('WebRTC_monitor_call_from_%s', fromUsername);
		} else if (subscription && subscription.t === 'd') {
			if (data.media && data.media.video) {
				icon = 'videocam';
				title = t('WebRTC_direct_video_call_from_%s', fromUsername);
			} else {
				icon = 'phone';
				title = t('WebRTC_direct_audio_call_from_%s', fromUsername);
			}
		} else if (data.media && data.media.video) {
			icon = 'videocam';
			title = t('WebRTC_group_video_call_from_%s', subscription.name);
		} else {
			icon = 'phone';
			title = t('WebRTC_group_audio_call_from_%s', subscription.name);
		}
		modal.open(
			{
				title: `<i class='icon-${icon} alert-icon success-color'></i>${title}`,
				text: t('Do_you_want_to_accept'),
				html: true,
				showCancelButton: true,
				confirmButtonText: t('Yes'),
				cancelButtonText: t('No'),
			},
			(isConfirm) => {
				if (isConfirm) {
					goToRoomById(data.room);
					return this.joinCall({
						to: data.from,
						monitor: data.monitor,
						media: data.media,
					});
				}
				this.stop();
			},
		);
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

	joinCall(data = {}, ...args) {
		data.media = this.media;
		this.log('joinCall', [data, ...args]);
		this.getLocalUserMedia(() => {
			this.remoteMonitoring = data.monitor;
			this.active = true;
			this.transport.joinCall(data);
		});
	}

	onRemoteJoin(data, ...args) {
		if (this.active !== true) {
			return;
		}
		this.log('onRemoteJoin', [data, ...args]);
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
		const onOffer = (offer) => {
			const onLocalDescription = () => {
				this.transport.sendDescription({
					to: data.from,
					type: 'offer',
					ts: peerConnection.createdAt,
					media: this.media,
					description: {
						sdp: offer.sdp,
						type: offer.type,
					},
				});
			};

			peerConnection.setLocalDescription(new RTCSessionDescription(offer), onLocalDescription, this.onError);
		};

		if (data.monitor === true) {
			peerConnection.createOffer(onOffer, this.onError, {
				mandatory: {
					OfferToReceiveAudio: data.media.audio,
					OfferToReceiveVideo: data.media.video,
				},
			});
		} else {
			peerConnection.createOffer(onOffer, this.onError);
		}
	}

	onRemoteOffer(data, ...args) {
		if (this.active !== true) {
			return;
		}

		this.log('onRemoteOffer', [data, ...args]);
		let peerConnection = this.getPeerConnection(data.from);

		if (['have-local-offer', 'stable'].includes(peerConnection.signalingState) && peerConnection.createdAt < data.ts) {
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

		const onAnswer = (answer) => {
			const onLocalDescription = () => {
				this.transport.sendDescription({
					to: data.from,
					type: 'answer',
					ts: peerConnection.createdAt,
					description: {
						sdp: answer.sdp,
						type: answer.type,
					},
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

	onRemoteCandidate(data, ...args) {
		if (this.active !== true) {
			return;
		}
		if (data.to !== this.selfId) {
			return;
		}
		this.log('onRemoteCandidate', [data, ...args]);
		const peerConnection = this.getPeerConnection(data.from);
		if (
			peerConnection.iceConnectionState !== 'closed' &&
			peerConnection.iceConnectionState !== 'failed' &&
			peerConnection.iceConnectionState !== 'disconnected' &&
			peerConnection.iceConnectionState !== 'completed'
		) {
			peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
		}
		document.querySelector('video#remoteVideo').srcObject = this.remoteItems.get()[0]?.url;
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

	onRemoteDescription(data, ...args) {
		if (this.active !== true) {
			return;
		}
		if (data.to !== this.selfId) {
			return;
		}
		this.log('onRemoteDescription', [data, ...args]);
		const peerConnection = this.getPeerConnection(data.from);
		if (data.type === 'offer') {
			peerConnection.remoteMedia = data.media;
			this.onRemoteOffer({
				from: data.from,
				ts: data.ts,
				description: data.description,
			});
		} else {
			peerConnection.setRemoteDescription(new RTCSessionDescription(data.description));
		}
	}
}

const WebRTC = new (class {
	constructor() {
		this.instancesByRoomId = {};
	}

	getInstanceByRoomId(rid, visitorId = null) {
		let enabled = false;
		if (!visitorId) {
			const subscription = ChatSubscription.findOne({ rid });
			if (!subscription) {
				return;
			}
			switch (subscription.t) {
				case 'd':
					enabled = settings.get('WebRTC_Enable_Direct');
					break;
				case 'p':
					enabled = settings.get('WebRTC_Enable_Private');
					break;
				case 'c':
					enabled = settings.get('WebRTC_Enable_Channel');
					break;
				case 'l':
					enabled = settings.get('Omnichannel_call_provider') === 'WebRTC';
			}
		} else {
			enabled = settings.get('Omnichannel_call_provider') === 'WebRTC';
		}
		enabled = enabled && settings.get('WebRTC_Enabled');
		if (enabled === false) {
			return;
		}
		if (this.instancesByRoomId[rid] == null) {
			let uid = Meteor.userId();
			let autoAccept = false;
			if (visitorId) {
				uid = visitorId;
				autoAccept = true;
			}
			this.instancesByRoomId[rid] = new WebRTCClass(uid, rid, autoAccept);
		}
		return this.instancesByRoomId[rid];
	}
})();

Meteor.startup(function () {
	Tracker.autorun(function () {
		if (Meteor.userId()) {
			Notifications.onUser(WEB_RTC_EVENTS.WEB_RTC, (type, data) => {
				if (data.room == null) {
					return;
				}
				const webrtc = WebRTC.getInstanceByRoomId(data.room);
				webrtc.onUserStream(type, data);
			});
		}
	});
});

export { WebRTC };
