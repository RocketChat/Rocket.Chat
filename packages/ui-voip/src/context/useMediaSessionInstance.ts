import { Emitter } from '@rocket.chat/emitter';
import { MediaSignalingSession, MediaCallWebRTCProcessor } from '@rocket.chat/media-signaling';
import type { MediaSignalTransport, ClientMediaSignal, ServerMediaSignal, WebRTCProcessorConfig } from '@rocket.chat/media-signaling';
import { useSetting, useStream, useWriteStream } from '@rocket.chat/ui-contexts';
import { useEffect, useSyncExternalStore, useCallback } from 'react';

import type { ConnectionState, PeerInfo, State } from './MediaCallContext';
import { MediaCallLogger } from './MediaCallLogger';
import { useIceServers } from '../hooks/useIceServers';

interface IBaseSession {
	state: State;
	connectionState: ConnectionState;
	peerInfo: PeerInfo | undefined;
	transferredBy: string | undefined;
	muted: boolean;
	held: boolean;
	remoteMuted: boolean;
	remoteHeld: boolean;
	startedAt: Date | null; // todo not sure if I need this
	hidden: boolean;
}

interface IEmptySession extends IBaseSession {
	state: Extract<State, 'closed' | 'new'>;
	callId: undefined;
}

interface ICallSession extends IBaseSession {
	state: Extract<State, 'calling' | 'ringing' | 'ongoing'>;
	callId: string;
	peerInfo: PeerInfo;
}

export type SessionInfo = IEmptySession | ICallSession;

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

class MediaSessionStore extends Emitter<{ change: void }> {
	private sessionInstance: MediaSignalingSession | null = null;

	private sendSignalFn: SignalTransport | null = null;

	private _webrtcProcessorFactory: ((config: WebRTCProcessorConfig) => MediaCallWebRTCProcessor) | null = null;

	constructor() {
		super();
	}

	private change() {
		this.emit('change');
	}

	public onChange(callback: () => void) {
		return this.on('change', callback);
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

	private makeInstance(userId: string) {
		if (this.sessionInstance !== null) {
			this.sessionInstance.endSession();
			this.sessionInstance = null;
		}

		if (!this._webrtcProcessorFactory || !this.sendSignalFn) {
			return null;
		}

		this.sessionInstance = new MediaSignalingSession({
			userId,
			transport: (signal: ClientMediaSignal) => this.sendSignal(signal),
			processorFactories: {
				webrtc: (config) => this.webrtcProcessorFactory(config),
			},
			mediaStreamFactory: (...args) => navigator.mediaDevices.getUserMedia(...args),
			randomStringFactory,
			oldSessionId: this.getOldSessionId(userId),
			logger: new MediaCallLogger(),
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

		this.sessionInstance.processSignal(signal);
	}
}

const mediaSession = new MediaSessionStore();

export const useMediaSessionInstance = (userId?: string) => {
	const iceServers = useIceServers();
	const iceGatheringTimeout = useSetting('VoIP_TeamCollab_Ice_Gathering_Timeout', 5000);

	const notifyUserStream = useStream('notify-user');
	const writeStream = useWriteStream('notify-user');

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
