import { Emitter } from '@rocket.chat/emitter';
import { MediaSignalingSession, MediaCallWebRTCProcessor } from '@rocket.chat/media-signaling';
import type { MediaSignalTransport, ClientMediaSignal, ServerMediaSignal, WebRTCProcessorConfig } from '@rocket.chat/media-signaling';
import { useSetting, useStream, useWriteStream } from '@rocket.chat/ui-contexts';
import { useEffect, useSyncExternalStore, useCallback } from 'react';

import { useIceServers } from '../hooks/useIceServers';
import type { PeerInfo, State } from '../v2/MediaCallContext';

interface BaseSession {
	state: State;
	peerInfo?: PeerInfo;
	muted: boolean;
	held: boolean;
	startedAt: Date | null; // todo not sure if I need this
}

interface EmptySession extends BaseSession {
	state: Extract<State, 'closed' | 'new'>;
}

interface CallSession extends BaseSession {
	state: Extract<State, 'calling' | 'ringing' | 'ongoing'>;
	peerInfo: PeerInfo;
}

export type SessionInfo = EmptySession | CallSession;

type SignalTransport = MediaSignalTransport<ClientMediaSignal>;

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

	private makeInstance(userId: string) {
		this.sessionInstance = new MediaSignalingSession({
			userId,
			transport: (signal: ClientMediaSignal) => this.sendSignal(signal),
			processorFactories: {
				webrtc: (config) => this.webrtcProcessorFactory(config),
			},
		});

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

		// TODO: maybe we need a cleanup step on the instance?
		return this.makeInstance(userId);
	}

	public setSendSignalFn(sendSignalFn: SignalTransport) {
		this.sendSignalFn = sendSignalFn;
		return () => {
			this.sendSignalFn = null;
		};
	}

	public setWebRTCProcessorFactory(factory: (config: WebRTCProcessorConfig) => MediaCallWebRTCProcessor) {
		this._webrtcProcessorFactory = factory;
	}
}

const mediaSession = new MediaSessionStore();

export const useMediaSessionInstance = (userId?: string) => {
	const instance = useSyncExternalStore(
		useCallback((callback) => {
			return mediaSession.onChange(callback);
		}, []),
		useCallback(() => {
			return mediaSession.getInstance(userId);
		}, [userId]),
	);

	const iceServers = useIceServers();
	const iceGatheringTimeout = useSetting('VoIP_TeamCollab_Ice_Gathering_Timeout', 5000);

	const notifyUserStream = useStream('notify-user');
	const writeStream = useWriteStream('notify-user');

	useEffect(() => {
		// TODO: This stream is not typed.
		return mediaSession.setSendSignalFn((signal: ClientMediaSignal) => writeStream(`${userId}/media-calls` as any, JSON.stringify(signal)));
	}, [writeStream, userId]);

	useEffect(() => {
		if (!instance) {
			return;
		}

		const unsubNotification = notifyUserStream(`${instance.userId}/media-signal`, (signal: ServerMediaSignal) =>
			instance.processSignal(signal),
		);

		return () => {
			unsubNotification();
		};
	}, [instance, notifyUserStream]);

	useEffect(() => {
		mediaSession.setWebRTCProcessorFactory(
			(config) => new MediaCallWebRTCProcessor({ ...config, rtc: { ...config.rtc, iceServers }, iceGatheringTimeout }),
		);
	}, [iceServers, iceGatheringTimeout]);

	return instance ?? undefined;
};
