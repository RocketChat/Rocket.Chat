import { Emitter } from '@rocket.chat/emitter';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { MediaSignalingSession, MediaCallWebRTCProcessor } from '@rocket.chat/media-signaling';
import type { MediaSignalTransport, ClientMediaSignal, ServerMediaSignal } from '@rocket.chat/media-signaling';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useStream, useToastMessageDispatch, useWriteStream } from '@rocket.chat/ui-contexts';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MediaCallLogger } from './MediaCallLogger';
import { stopTracks } from '../hooks';
import { useIceServers } from '../hooks/useIceServers';

type SignalTransport = MediaSignalTransport<ClientMediaSignal>;

const randomStringFactory = () => {
	if (!window.crypto) {
		return Math.random().toString(36).substring(2, 15);
	}

	return window.crypto.randomUUID();
};

const getSessionIdKey = (userId: string) => {
	return `rcx-media-session-id-${userId}`;
};

type MediaSessionStoreEventMap = {
	requestToast: { message: TranslationKey; args?: Record<string, string>; type: 'error' | 'success' | 'info' | 'warning' };
};

const MAX_FAILED_SCREEN_SHARE_ATTEMPTS = 3;
const isNotAllowedError = (error: unknown): error is DOMException & { name: 'NotAllowedError' } => {
	return error instanceof DOMException && error.name === 'NotAllowedError';
};

let fakeStream: { audioCtx: AudioContext; stream: MediaStream } | null = null;
let fakeStreamTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

const getFakeStream = () => {
	if (fakeStream) {
		stopFakeStream();
	}

	const audioCtx = new AudioContext();
	const { stream } = audioCtx.createMediaStreamDestination();

	fakeStream = {
		audioCtx,
		stream,
	};

	return fakeStream.stream;
};

const stopFakeStream = () => {
	if (fakeStreamTimeout) {
		clearTimeout(fakeStreamTimeout);
	}
	if (!fakeStream) {
		return;
	}
	stopTracks(fakeStream.stream);
	void fakeStream.audioCtx.close();
	fakeStream = null;
};

class MediaSessionStore extends Emitter<MediaSessionStoreEventMap> {
	private sessionInstance: MediaSignalingSession | null = null;

	private sendSignalFn: SignalTransport | null = null;

	private failedScreenShareAttempts = 0;

	private logger = new MediaCallLogger();

	private popoutWindow: Window | undefined;

	private lastSessionId: string | undefined;

	constructor() {
		super();
	}

	private requestToast({ message, args, type }: MediaSessionStoreEventMap['requestToast']) {
		this.emit('requestToast', { message, args, type });
	}

	private sendSignal(signal: ClientMediaSignal) {
		if (this.sendSignalFn) {
			return this.sendSignalFn(signal);
		}

		console.warn('Media Call - Tried to send signal, but no sendSignalFn was set');
		return Promise.resolve();
	}

	private getOldSessionId(userId: string) {
		if (!window.sessionStorage) {
			return undefined;
		}

		const key = getSessionIdKey(userId);

		const oldSessionId = window.sessionStorage.getItem(key);

		if (!oldSessionId) {
			return undefined;
		}

		window.sessionStorage.removeItem(key);

		// never resume a session this tab created itself: the stored id is written on creation, so a re-created
		// instance (StrictMode remount, userId change and back) would otherwise adopt the id of the one it replaced
		if (oldSessionId === this.lastSessionId) {
			return undefined;
		}

		return oldSessionId;
	}

	private async getUserMedia(constraints: MediaStreamConstraints) {
		try {
			if (this.sessionInstance?.micless) {
				return getFakeStream();
			}
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			if (!stream) {
				throw new Error();
			}
			// Wait a little to ensure the track switch happened.
			// It's ok for the old stream/audioCtx to hang unused for a little
			fakeStreamTimeout = setTimeout(stopFakeStream, 1000);
			return stream;
		} catch (error) {
			if (this.sessionInstance) {
				this.sessionInstance.micless = true;
			}
			return getFakeStream();
		}
	}

	private async getDisplayMedia(constraints: MediaStreamConstraints) {
		try {
			const actualWindow = this.popoutWindow || window;
			if (!actualWindow.navigator?.mediaDevices?.getDisplayMedia) {
				throw new Error('getDisplayMedia is not supported');
			}

			const stream = await actualWindow.navigator.mediaDevices.getDisplayMedia(constraints);
			if (!stream) {
				this.logger.log('MediaSessionStore - getDisplayMedia - no stream returned');
				throw new Error('MediaSessionStore - getDisplayMedia - Failed to get display media');
			}

			this.failedScreenShareAttempts = 0;
			return stream;
		} catch (error) {
			this.logger.log('MediaSessionStore - getDisplayMedia - error', {
				attempts: this.failedScreenShareAttempts,
				error,
			});

			if (isNotAllowedError(error) && this.failedScreenShareAttempts < MAX_FAILED_SCREEN_SHARE_ATTEMPTS) {
				this.logger.log('MediaSessionStore - getDisplayMedia - error - soft failure #', this.failedScreenShareAttempts);
				this.failedScreenShareAttempts++;
				throw error;
			}

			this.logger.log('MediaSessionStore - getDisplayMedia - error - dispatching toast');
			this.requestToast({ message: 'Share_screen_failed_update_or_check_permissions', type: 'info' });

			throw error;
		}
	}

	public cleanupInstance() {
		if (this.sessionInstance === null) {
			return;
		}
		this.sessionInstance.endSession();
		this.sessionInstance = null;
		this.sendSignalFn = null;
	}

	public getInstance(
		userId: string,
		sendSignalFn: SignalTransport,
		getWebRTCConfig: () => { iceServers: RTCIceServer[]; iceGatheringTimeout: number },
	) {
		// must be idempotent: it's called from render, which may run more than once per commit (StrictMode, discarded renders)
		if (this.sessionInstance?.userId === userId) {
			return this.sessionInstance;
		}
		return this.makeInstance(userId, sendSignalFn, getWebRTCConfig);
	}

	private makeInstance(
		userId: string,
		sendSignalFn: SignalTransport,
		getWebRTCConfig: () => { iceServers: RTCIceServer[]; iceGatheringTimeout: number },
	) {
		this.cleanupInstance();

		this.failedScreenShareAttempts = 0;

		// must be set before the session is constructed: the constructor already sends the register signal
		this.sendSignalFn = sendSignalFn;

		this.sessionInstance = new MediaSignalingSession({
			userId,
			transport: (signal: ClientMediaSignal) => {
				void this.sendSignal(signal);
			},
			processorFactories: {
				// config read on every processor creation, so setting/ice changes apply without recreating the session
				webrtc: (config) => {
					const { iceServers, iceGatheringTimeout } = getWebRTCConfig();
					return new MediaCallWebRTCProcessor({ ...config, rtc: { ...config.rtc, iceServers }, iceGatheringTimeout });
				},
			},
			displayMediaFactory: (...args) => this.getDisplayMedia(...args),
			mediaStreamFactory: (...args) => this.getUserMedia(...args),
			randomStringFactory,
			oldSessionId: this.getOldSessionId(userId),
			logger: this.logger,
			features: ['audio', 'screen-share', 'transfer', 'hold'],
			autoSync: true,
		});

		this.lastSessionId = this.sessionInstance.sessionId;

		if (window.sessionStorage) {
			window.sessionStorage.setItem(getSessionIdKey(userId), this.sessionInstance.sessionId);
		}

		return this.sessionInstance;
	}

	public setPopoutWindow(popoutWindow?: Window) {
		if (!popoutWindow) {
			this.popoutWindow = undefined;
		}
		this.popoutWindow = popoutWindow;
	}
}

const mediaSession = new MediaSessionStore();

export const useSetPopoutWindow = (popoutWindow?: Window) => {
	useEffect(() => {
		mediaSession.setPopoutWindow(popoutWindow);
		return () => mediaSession.setPopoutWindow(undefined);
	});
};

export const useMediaSessionInstance = (userId?: string, enabled = true) => {
	const [instance, setInstance] = useState<MediaSignalingSession | undefined>(undefined);
	const { t } = useTranslation();
	const iceServers = useIceServers();
	const iceGatheringTimeout = useSetting('VoIP_TeamCollab_Ice_Gathering_Timeout', 5000);

	const notifyUserStream = useStream('notify-user');
	const writeStream = useWriteStream('notify-user');

	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(
		() => mediaSession.on('requestToast', ({ message, args, type }) => dispatchToastMessage({ message: t(message, args), type })),
		[dispatchToastMessage, t],
	);

	const sendSignal = useStableCallback((signal: ClientMediaSignal) => writeStream(`${userId}/media-calls` as any, JSON.stringify(signal)));
	const getWebRTCConfig = useStableCallback(() => ({ iceServers, iceGatheringTimeout }));

	useEffect(() => {
		if (!userId || !enabled) {
			setInstance(undefined);
			return;
		}

		const instance = mediaSession.getInstance(userId, sendSignal, getWebRTCConfig);

		setInstance(instance);

		const subscription = notifyUserStream(`${userId}/media-signal`, (signal: ServerMediaSignal) => instance.processSignal(signal));

		return () => {
			subscription();
			mediaSession.cleanupInstance();
		};
	}, [userId, enabled, sendSignal, getWebRTCConfig, notifyUserStream]);

	return instance;
};
