import { Emitter } from '@rocket.chat/emitter';
import { MediaSignalingSession, MediaCallWebRTCProcessor } from '@rocket.chat/media-signaling';
import type { MediaSignalTransport, ClientMediaSignal, ServerMediaSignal, WebRTCProcessorConfig } from '@rocket.chat/media-signaling';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useStream, useToastMessageDispatch, useWriteStream } from '@rocket.chat/ui-contexts';
import { useEffect, useSyncExternalStore, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { MediaCallLogger } from './MediaCallLogger';
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
	change: void;
	requestToast: { message: TranslationKey; args?: Record<string, string>; type: 'error' | 'success' | 'info' | 'warning' };
};

const MAX_FAILED_SCREEN_SHARE_ATTEMPTS = 3;
const isNotAllowedError = (error: unknown): error is DOMException & { name: 'NotAllowedError' } => {
	return error instanceof DOMException && error.name === 'NotAllowedError';
};

class MediaSessionStore extends Emitter<MediaSessionStoreEventMap> {
	private sessionInstance: MediaSignalingSession | null = null;

	private sendSignalFn: SignalTransport | null = null;

	private _webrtcProcessorFactory: ((config: WebRTCProcessorConfig) => MediaCallWebRTCProcessor) | null = null;

	private failedScreenShareAttempts = 0;

	private logger = new MediaCallLogger();

	constructor() {
		super();
	}

	private change() {
		this.emit('change');
	}

	public onChange(callback: () => void) {
		return this.on('change', callback);
	}

	private requestToast({ message, args, type }: MediaSessionStoreEventMap['requestToast']) {
		this.emit('requestToast', { message, args, type });
	}

	private webrtcProcessorFactory(config: WebRTCProcessorConfig) {
		if (!this._webrtcProcessorFactory) {
			throw new Error('WebRTC processor factory not set');
		}
		return this._webrtcProcessorFactory(config);
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
		return oldSessionId;
	}

	private async getDisplayMedia(constraints: MediaStreamConstraints) {
		try {
			if (!navigator?.mediaDevices?.getDisplayMedia) {
				throw new Error('getDisplayMedia is not supported');
			}

			const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
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

	private makeInstance(userId: string) {
		if (this.sessionInstance !== null) {
			this.sessionInstance.endSession();
			this.sessionInstance = null;
		}

		this.failedScreenShareAttempts = 0;

		if (!this._webrtcProcessorFactory || !this.sendSignalFn) {
			return null;
		}

		this.sessionInstance = new MediaSignalingSession({
			userId,
			transport: (signal: ClientMediaSignal) => {
				void this.sendSignal(signal);
			},
			processorFactories: {
				webrtc: (config) => this.webrtcProcessorFactory(config),
			},
			displayMediaFactory: (...args) => this.getDisplayMedia(...args),
			mediaStreamFactory: (...args) => navigator.mediaDevices.getUserMedia(...args),
			randomStringFactory,
			oldSessionId: this.getOldSessionId(userId),
			logger: this.logger,
			features: ['audio', 'screen-share', 'transfer', 'hold'],
			autoSync: true,
		});

		if (window.sessionStorage) {
			window.sessionStorage.setItem(getSessionIdKey(userId), this.sessionInstance.sessionId);
		}

		this.change();

		return this.sessionInstance;
	}

	public getInstance(userId?: string) {
		if (!userId) {
			return null;
		}

		if (this.sessionInstance?.userId === userId) {
			return this.sessionInstance;
		}

		return this.makeInstance(userId);
	}

	public setSendSignalFn(sendSignalFn: SignalTransport) {
		this.sendSignalFn = sendSignalFn;
		this.change();
		return () => {
			this.sendSignalFn = null;
		};
	}

	public setWebRTCProcessorFactory(factory: (config: WebRTCProcessorConfig) => MediaCallWebRTCProcessor) {
		this._webrtcProcessorFactory = factory;
		this.change();
	}

	public processSignal(signal: ServerMediaSignal, userId?: string) {
		if (!this.sessionInstance || this.sessionInstance.userId !== userId) {
			return;
		}

		void this.sessionInstance.processSignal(signal);
	}
}

const mediaSession = new MediaSessionStore();

export const useMediaSessionInstance = (userId?: string) => {
	const { t } = useTranslation();
	const iceServers = useIceServers();
	const iceGatheringTimeout = useSetting('VoIP_TeamCollab_Ice_Gathering_Timeout', 5000);

	const notifyUserStream = useStream('notify-user');
	const writeStream = useWriteStream('notify-user');

	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		mediaSession.setWebRTCProcessorFactory(
			(config) => new MediaCallWebRTCProcessor({ ...config, rtc: { ...config.rtc, iceServers }, iceGatheringTimeout }),
		);
	}, [iceServers, iceGatheringTimeout]);

	useEffect(() => {
		// TODO: This stream is not typed.
		return mediaSession.setSendSignalFn((signal: ClientMediaSignal) => writeStream(`${userId}/media-calls` as any, JSON.stringify(signal)));
	}, [writeStream, userId]);

	useEffect(() => {
		if (!userId) {
			return;
		}

		const unsubNotification = notifyUserStream(`${userId}/media-signal`, (signal: ServerMediaSignal) =>
			mediaSession.processSignal(signal, userId),
		);

		return () => {
			unsubNotification();
		};
	}, [userId, notifyUserStream]);

	useEffect(() => {
		return mediaSession.on('requestToast', ({ message, args, type }) => {
			dispatchToastMessage({ message: t(message, args), type });
		});
	}, [dispatchToastMessage, t]);

	const instance = useSyncExternalStore(
		useCallback((callback) => {
			return mediaSession.onChange(callback);
		}, []),
		useCallback(() => {
			return mediaSession.getInstance(userId);
		}, [userId]),
	);

	return instance ?? undefined;
};
