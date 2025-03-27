import type { IRoom } from '@rocket.chat/core-typings';
import type { StreamKeys, StreamNames, StreamerCallbackArgs } from '@rocket.chat/ddp-client';
import { Emitter } from '@rocket.chat/emitter';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { ChromeScreenShare } from './screenShare';
import GenericModal from '../../../client/components/GenericModal';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import { goToRoomById } from '../../../client/lib/utils/goToRoomById';
import { Subscriptions } from '../../models/client';
import { settings } from '../../settings/client';
import { sdk } from '../../utils/client/lib/SDKClient';
import { t } from '../../utils/lib/i18n';
import { WEB_RTC_EVENTS } from '../lib/constants';

// FIXME: there is a mix of obsolete definitions and incorrect field assignments

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface RTCPeerConnection {
		/** @deprecated non-standard */
		createdAt: number;
		/** @deprecated non-standard */
		remoteMedia: MediaStreamConstraints;
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface RTCOfferOptions {
		/** @deprecated non-standard */
		mandatory?: unknown;
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface MediaStream {
		/** @deprecated non-standard */
		volume?: GainNode;
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface MediaStreamConstraints {
		/** @deprecated non-standard */
		desktop?: boolean;
	}

	/** @deprecated browser-specific global */
	const chrome: {
		webstore: {
			install(url: string, onSuccess: () => void, onError: (error: any) => void): void;
		};
	};

	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Window {
		rocketchatscreenshare?: unknown;
		audioContext?: AudioContext;
	}
}

type EventData<TStreamName extends StreamNames, TStreamKey extends StreamKeys<TStreamName>, TType> = Extract<
	StreamerCallbackArgs<TStreamName, TStreamKey>,
	[type: TType, data: any]
>[1];

type StatusData = EventData<'notify-room', `${string}/webrtc`, 'status'>;
type CallData = EventData<'notify-room-users', `${string}/webrtc`, 'call'>;
export type CandidateData = EventData<'notify-user', `${string}/webrtc`, 'candidate'>;
export type DescriptionData = EventData<'notify-user', `${string}/webrtc`, 'description'>;
export type JoinData = EventData<'notify-user', `${string}/webrtc`, 'join'>;

type RemoteItem = {
	id: string;
	url: MediaStream;
	state: RTCIceConnectionState;
	stateText?: string;
	connected?: boolean;
};

type RemoteConnection = {
	id: string;
	media: MediaStreamConstraints;
};

class WebRTCTransportClass extends Emitter<{
	status: StatusData;
	call: CallData;
	candidate: CandidateData;
	description: DescriptionData;
	join: JoinData;
}> {
	public debug = false;

	constructor(public webrtcInstance: WebRTCClass) {
		super();
		sdk.stream('notify-room', [`${this.webrtcInstance.room}/${WEB_RTC_EVENTS.WEB_RTC}`], (type, data) => {
			this.log('WebRTCTransportClass - onRoom', type, data);
			this.emit(type, data);
		});
	}

	log(...args: unknown[]) {
		if (this.debug === true) {
			console.log(...args);
		}
	}

	onUserStream(type: 'candidate', data: CandidateData): void;

	onUserStream(type: 'description', data: DescriptionData): void;

	onUserStream(type: 'join', data: JoinData): void;

	onUserStream(
		...[type, data]:
			| [type: 'candidate', data: CandidateData]
			| [type: 'description', data: DescriptionData]
			| [type: 'join', data: JoinData]
	) {
		if (data.room !== this.webrtcInstance.room) {
			return;
		}

		this.log('WebRTCTransportClass - onUser', type, data);

		switch (type) {
			case 'candidate':
				this.emit('candidate', data);
				break;
			case 'description':
				this.emit('description', data);
				break;
			case 'join':
				this.emit('join', data);
				break;
		}
	}

	startCall(data: CallData) {
		this.log('WebRTCTransportClass - startCall', this.webrtcInstance.room, this.webrtcInstance.selfId);
		sdk.publish('notify-room-users', [
			`${this.webrtcInstance.room}/${WEB_RTC_EVENTS.WEB_RTC}`,
			WEB_RTC_EVENTS.CALL,
			{
				from: this.webrtcInstance.selfId,
				room: this.webrtcInstance.room,
				media: data.media,
				monitor: data.monitor,
			},
		]);
	}

	joinCall(data: JoinData) {
		this.log('WebRTCTransportClass - joinCall', this.webrtcInstance.room, this.webrtcInstance.selfId);
		if (data.monitor === true) {
			sdk.publish('notify-user', [
				`${data.to}/${WEB_RTC_EVENTS.WEB_RTC}`,
				WEB_RTC_EVENTS.JOIN,
				{
					from: this.webrtcInstance.selfId,
					room: this.webrtcInstance.room,
					media: data.media,
					monitor: data.monitor,
				},
			]);
		} else {
			sdk.publish('notify-room-users', [
				`${this.webrtcInstance.room}/${WEB_RTC_EVENTS.WEB_RTC}`,
				WEB_RTC_EVENTS.JOIN,
				{
					from: this.webrtcInstance.selfId,
					room: this.webrtcInstance.room,
					media: data.media,
					monitor: data.monitor,
				},
			]);
		}
	}

	sendCandidate(data: CandidateData) {
		data.from = this.webrtcInstance.selfId;
		data.room = this.webrtcInstance.room;
		this.log('WebRTCTransportClass - sendCandidate', data);
		sdk.publish('notify-user', [`${data.to}/${WEB_RTC_EVENTS.WEB_RTC}`, WEB_RTC_EVENTS.CANDIDATE, data]);
	}

	sendDescription(data: DescriptionData) {
		data.from = this.webrtcInstance.selfId;
		data.room = this.webrtcInstance.room;
		this.log('WebRTCTransportClass - sendDescription', data);
		sdk.publish('notify-user', [`${data.to}/${WEB_RTC_EVENTS.WEB_RTC}`, WEB_RTC_EVENTS.DESCRIPTION, data]);
	}

	sendStatus(data: StatusData) {
		this.log('WebRTCTransportClass - sendStatus', data, this.webrtcInstance.room);
		data.from = this.webrtcInstance.selfId;
		sdk.publish('notify-room', [`${this.webrtcInstance.room}/${WEB_RTC_EVENTS.WEB_RTC}`, WEB_RTC_EVENTS.STATUS, data]);
	}

	onRemoteCall(fn: (data: CallData) => void) {
		return this.on(WEB_RTC_EVENTS.CALL, fn);
	}

	onRemoteJoin(fn: (data: JoinData) => void) {
		return this.on(WEB_RTC_EVENTS.JOIN, fn);
	}

	onRemoteCandidate(fn: (data: CandidateData) => void) {
		return this.on(WEB_RTC_EVENTS.CANDIDATE, fn);
	}

	onRemoteDescription(fn: (data: DescriptionData) => void) {
		return this.on(WEB_RTC_EVENTS.DESCRIPTION, fn);
	}

	onRemoteStatus(fn: (data: StatusData) => void) {
		return this.on(WEB_RTC_EVENTS.STATUS, fn);
	}
}

class WebRTCClass {
	transport: WebRTCTransportClass;

	config: { iceServers: RTCIceServer[] };

	debug: boolean;

	TransportClass: typeof WebRTCTransportClass;

	peerConnections: Record<string, RTCPeerConnection> = {};

	remoteItems: ReactiveVar<RemoteItem[]>;

	remoteItemsById: ReactiveVar<Record<string, RemoteItem>>;

	callInProgress: ReactiveVar<boolean>;

	audioEnabled: ReactiveVar<boolean>;

	videoEnabled: ReactiveVar<boolean>;

	overlayEnabled: ReactiveVar<boolean>;

	screenShareEnabled: ReactiveVar<boolean>;

	localUrl: ReactiveVar<MediaStream | undefined>;

	active: boolean;

	remoteMonitoring: boolean;

	monitor: boolean;

	navigator: string | undefined;

	screenShareAvailable: boolean;

	media: MediaStreamConstraints;

	constructor(
		public selfId: string,
		public room: string,
		public autoAccept = false,
	) {
		this.config = {
			iceServers: [],
		};
		this.debug = false;
		this.TransportClass = WebRTCTransportClass;
		let servers = settings.get<string>('WebRTC_Servers');
		if (servers && servers.trim() !== '') {
			servers = servers.replace(/\s/g, '');

			servers.split(',').forEach((server) => {
				const parts = server.split('@');
				const serverConfig: RTCIceServer = {
					urls: parts.pop()!,
				};
				if (parts.length === 1) {
					const [username, credential] = parts[0].split(':');
					serverConfig.username = decodeURIComponent(username);
					serverConfig.credential = decodeURIComponent(credential);
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
		this.localUrl = new ReactiveVar(undefined);
		this.active = false;
		this.remoteMonitoring = false;
		this.monitor = false;
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

		this.screenShareAvailable = ['chrome', 'firefox', 'electron'].includes(this.navigator!);
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

		setInterval(this.checkPeerConnections.bind(this), 1000);
	}

	onUserStream(type: 'candidate', data: CandidateData): void;

	onUserStream(type: 'description', data: DescriptionData): void;

	onUserStream(type: 'join', data: JoinData): void;

	onUserStream(
		...[type, data]:
			| [type: 'candidate', data: CandidateData]
			| [type: 'description', data: DescriptionData]
			| [type: 'join', data: JoinData]
	) {
		switch (type) {
			case 'candidate':
				this.transport.onUserStream('candidate', data);
				break;

			case 'description':
				this.transport.onUserStream('description', data);
				break;

			case 'join':
				this.transport.onUserStream('join', data);
				break;
		}
	}

	log(...args: unknown[]) {
		if (this.debug === true) {
			console.log(...args);
		}
	}

	onError(...args: unknown[]) {
		console.error(...args);
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
		const items: RemoteItem[] = [];
		const itemsById: Record<string, RemoteItem> = {};
		const { peerConnections } = this;

		Object.entries(peerConnections).forEach(([id, peerConnection]) => {
			peerConnection.getRemoteStreams().forEach((remoteStream) => {
				const item: RemoteItem = {
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
		const remoteConnections: RemoteConnection[] = [];
		const { peerConnections } = this;
		Object.entries(peerConnections).forEach(([id, { remoteMedia: media }]) => {
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

	callInProgressTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

	onRemoteStatus(data: StatusData) {
		// this.log(onRemoteStatus, arguments);
		this.callInProgress.set(true);
		clearTimeout(this.callInProgressTimeout);
		this.callInProgressTimeout = setTimeout(this.resetCallInProgress, 2000);
		if (this.active !== true) {
			return;
		}
		const remoteConnections = [
			{
				id: data.from!,
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

	getPeerConnection(id: string) {
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
				setTimeout(() => {
					if (Object.keys(this.peerConnections).length === 0) {
						this.stop();
					}
				}, 3000);
			}
			this.updateRemoteItems();
		});
		return peerConnection;
	}

	audioContext: AudioContext | undefined;

	_getUserMedia(media: MediaStreamConstraints, onSuccess: (stream: MediaStream) => void, onError: (error?: any) => void) {
		const onSuccessLocal = (stream: MediaStream) => {
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

		if (navigator.mediaDevices?.getUserMedia) {
			return navigator.mediaDevices.getUserMedia(media).then(onSuccessLocal).catch(onError);
		}

		navigator.getUserMedia?.(media, onSuccessLocal, onError);
	}

	getUserMedia(media: MediaStreamConstraints, onSuccess: (stream: MediaStream) => void, onError: (error: any) => void = this.onError) {
		if (media.desktop !== true) {
			void this._getUserMedia(media, onSuccess, onError);
			return;
		}
		if (this.screenShareAvailable !== true) {
			console.log('Screen share is not avaliable');
			return;
		}
		const getScreen = (audioStream?: MediaStream) => {
			const refresh = function () {
				imperativeModal.open({
					component: GenericModal,
					props: {
						variant: 'warning',
						title: t('Refresh_your_page_after_install_to_enable_screen_sharing'),
					},
				});
			};

			const isChromeExtensionInstalled = this.navigator === 'chrome' && ChromeScreenShare.installed;
			const isFirefoxExtensionInstalled = this.navigator === 'firefox' && window.rocketchatscreenshare != null;

			if (!isChromeExtensionInstalled && !isFirefoxExtensionInstalled) {
				imperativeModal.open({
					component: GenericModal,
					props: {
						title: t('Screen_Share'),
						variant: 'warning',
						confirmText: t('Install_Extension'),
						cancelText: t('Cancel'),
						children: t('You_need_install_an_extension_to_allow_screen_sharing'),
						onConfirm: () => {
							if (this.navigator === 'chrome') {
								const url = 'https://chrome.google.com/webstore/detail/rocketchat-screen-share/nocfbnnmjnndkbipkabodnheejiegccf';
								try {
									chrome.webstore.install(url, refresh, () => {
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
						},
					},
				});

				return onError(false);
			}

			const getScreenSuccess = (stream: MediaStream) => {
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
				void this._getUserMedia(media, getScreenSuccess, onError);
			} else {
				ChromeScreenShare.getSourceId(this.navigator!, (id) => {
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
					void this._getUserMedia(media, getScreenSuccess, onError);
				});
			}
		};
		if (this.navigator === 'firefox' || media.audio == null || media.audio === false) {
			getScreen();
		} else {
			const getAudioSuccess = (audioStream: MediaStream) => {
				getScreen(audioStream);
			};
			const getAudioError = () => {
				getScreen();
			};

			void this._getUserMedia(
				{
					audio: media.audio,
				},
				getAudioSuccess,
				getAudioError,
			);
		}
	}

	getLocalUserMedia(callback: (...args: any[]) => void, ...args: unknown[]) {
		this.log('getLocalUserMedia', [callback, ...args]);
		if (this.localStream != null) {
			return callback(null, this.localStream);
		}
		const onSuccess = (stream: MediaStream) => {
			this.localStream = stream;
			!this.audioEnabled.get() && this.disableAudio();
			!this.videoEnabled.get() && this.disableVideo();
			this.localUrl.set(stream);
			const { peerConnections } = this;
			Object.entries(peerConnections).forEach(([, peerConnection]) => peerConnection.addStream(stream));
			document.querySelector<HTMLVideoElement>('video#localVideo')!.srcObject = stream;
			callback(null, this.localStream);
		};
		const onError = (error: any) => {
			callback(false);
			this.onError(error);
		};
		this.getUserMedia(this.media, onSuccess, onError);
	}

	stopPeerConnection = (id: string) => {
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

		void window.audioContext?.close(); // FIXME: probably should be `this.audioContext`
	}

	setAudioEnabled(enabled = true) {
		if (this.localStream != null) {
			this.localStream.getAudioTracks().forEach((audio) => {
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

	localStream: MediaStream | undefined;

	setVideoEnabled(enabled = true) {
		if (this.localStream != null) {
			this.localStream.getVideoTracks().forEach((video) => {
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

	startCall(media: MediaStreamConstraints = {}, ...args: unknown[]) {
		this.log('startCall', [media, ...args]);
		this.media = media;
		this.getLocalUserMedia(() => {
			this.active = true;
			this.transport.startCall({
				media: this.media,
			});
		});
	}

	startCallAsMonitor(media: MediaStreamConstraints = {}, ...args: unknown[]) {
		this.log('startCallAsMonitor', [media, ...args]);
		this.media = media;
		this.active = true;
		this.monitor = true;
		this.transport.startCall({
			media: this.media,
			monitor: true,
		});
	}

	onRemoteCall(data: CallData) {
		if (this.autoAccept === true) {
			setTimeout(() => {
				this.joinCall({
					to: data.from,
					monitor: data.monitor,
					media: data.media,
				});
			}, 0);
			return;
		}

		const user = Meteor.users.findOne(data.from);
		let fromUsername = undefined;
		if (user?.username) {
			fromUsername = user.username;
		}
		const subscription = Subscriptions.findOne({
			rid: data.room,
		})!;

		let icon;
		let title;
		if (data.monitor === true) {
			icon = 'eye' as const;
			title = t('WebRTC_monitor_call_from_%s', fromUsername);
		} else if (subscription && subscription.t === 'd') {
			if (data.media?.video) {
				icon = 'video' as const;
				title = t('WebRTC_direct_video_call_from_%s', fromUsername);
			} else {
				icon = 'phone' as const;
				title = t('WebRTC_direct_audio_call_from_%s', fromUsername);
			}
		} else if (data.media?.video) {
			icon = 'video' as const;
			title = t('WebRTC_group_video_call_from_%s', subscription.name);
		} else {
			icon = 'phone' as const;
			title = t('WebRTC_group_audio_call_from_%s', subscription.name);
		}

		imperativeModal.open({
			component: GenericModal,
			props: {
				title,
				icon,
				confirmText: t('Yes'),
				cancelText: t('No'),
				children: t('Do_you_want_to_accept'),
				onConfirm: () => {
					void goToRoomById(data.room!);
					return this.joinCall({
						to: data.from,
						monitor: data.monitor,
						media: data.media,
					});
				},
				onCancel: () => this.stop(),
				onClose: () => this.stop(),
			},
		});
	}

	joinCall(data: JoinData = {}, ...args: unknown[]) {
		data.media = this.media;
		this.log('joinCall', [data, ...args]);
		this.getLocalUserMedia(() => {
			this.remoteMonitoring = data.monitor!;
			this.active = true;
			this.transport.joinCall(data);
		});
	}

	onRemoteJoin(data: JoinData, ...args: unknown[]) {
		if (this.active !== true) {
			return;
		}
		this.log('onRemoteJoin', [data, ...args]);
		let peerConnection = this.getPeerConnection(data.from!);

		// needsRefresh = false
		// if peerConnection.iceConnectionState isnt 'new'
		// needsAudio = data.media.audio is true and peerConnection.remoteMedia.audio isnt true
		// needsVideo = data.media.video is true and peerConnection.remoteMedia.video isnt true
		// needsRefresh = needsAudio or needsVideo or data.media.desktop isnt peerConnection.remoteMedia.desktop

		// # if peerConnection.signalingState is "have-local-offer" or needsRefresh

		if ((peerConnection.signalingState as RTCSignalingState | 'checking') !== 'checking') {
			this.stopPeerConnection(data.from!);
			peerConnection = this.getPeerConnection(data.from!);
		}
		if (peerConnection.iceConnectionState !== 'new') {
			return;
		}
		peerConnection.remoteMedia = data.media!;
		if (this.localStream) {
			peerConnection.addStream(this.localStream);
		}
		const onOffer: RTCSessionDescriptionCallback = (offer) => {
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

			void peerConnection.setLocalDescription(new RTCSessionDescription(offer), onLocalDescription, this.onError);
		};

		if (data.monitor === true) {
			void peerConnection.createOffer(onOffer, this.onError, {
				mandatory: {
					OfferToReceiveAudio: data.media?.audio,
					OfferToReceiveVideo: data.media?.video,
				},
			});
		} else {
			void peerConnection.createOffer(onOffer, this.onError);
		}
	}

	onRemoteOffer(data: Omit<DescriptionData, 'type'>, ...args: unknown[]) {
		if (this.active !== true) {
			return;
		}

		this.log('onRemoteOffer', [data, ...args]);
		let peerConnection = this.getPeerConnection(data.from!);

		if (['have-local-offer', 'stable'].includes(peerConnection.signalingState) && peerConnection.createdAt < data.ts) {
			this.stopPeerConnection(data.from!);
			peerConnection = this.getPeerConnection(data.from!);
		}

		if (peerConnection.iceConnectionState !== 'new') {
			return;
		}

		void peerConnection.setRemoteDescription(new RTCSessionDescription(data.description));

		try {
			if (this.localStream) {
				peerConnection.addStream(this.localStream);
			}
		} catch (error) {
			console.log(error);
		}

		const onAnswer: RTCSessionDescriptionCallback = (answer) => {
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

			void peerConnection.setLocalDescription(new RTCSessionDescription(answer), onLocalDescription, this.onError);
		};

		void peerConnection.createAnswer(onAnswer, this.onError);
	}

	onRemoteCandidate(data: CandidateData, ...args: unknown[]) {
		if (this.active !== true) {
			return;
		}
		if (data.to !== this.selfId) {
			return;
		}
		this.log('onRemoteCandidate', [data, ...args]);
		const peerConnection = this.getPeerConnection(data.from!);
		if (
			peerConnection.iceConnectionState !== 'closed' &&
			peerConnection.iceConnectionState !== 'failed' &&
			peerConnection.iceConnectionState !== 'disconnected' &&
			peerConnection.iceConnectionState !== 'completed'
		) {
			void peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
		}
		document.querySelector<HTMLVideoElement>('video#remoteVideo')!.srcObject = this.remoteItems.get()[0]?.url;
	}

	onRemoteDescription(data: DescriptionData, ...args: unknown[]) {
		if (this.active !== true) {
			return;
		}
		if (data.to !== this.selfId) {
			return;
		}
		this.log('onRemoteDescription', [data, ...args]);
		const peerConnection = this.getPeerConnection(data.from!);
		if (data.type === 'offer') {
			peerConnection.remoteMedia = data.media;
			this.onRemoteOffer({
				from: data.from,
				ts: data.ts,
				description: data.description,
			});
		} else {
			void peerConnection.setRemoteDescription(new RTCSessionDescription(data.description));
		}
	}
}

const WebRTC = new (class {
	instancesByRoomId: Record<string, WebRTCClass> = {};

	constructor() {
		this.instancesByRoomId = {};
	}

	getInstanceByRoomId(rid: IRoom['_id'], visitorId: string | null = null) {
		let enabled = false;
		if (!visitorId) {
			const subscription = Subscriptions.findOne({ rid });
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
					enabled = settings.get<string>('Omnichannel_call_provider') === 'WebRTC';
			}
		} else {
			enabled = settings.get<string>('Omnichannel_call_provider') === 'WebRTC';
		}
		enabled = enabled && settings.get('WebRTC_Enabled');
		if (enabled === false) {
			return;
		}
		if (this.instancesByRoomId[rid] == null) {
			let uid = Meteor.userId()!;
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

export { WebRTC };
