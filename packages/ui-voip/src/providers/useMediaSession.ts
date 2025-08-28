import { Emitter } from '@rocket.chat/emitter';
import {
	// CallContact,
	MediaSignalingSession,
	MediaCallWebRTCProcessor,
	MediaSignalTransport,
	CallState,
	CallRole,
	ClientMediaSignal,
	ServerMediaSignal,
	WebRTCProcessorConfig,
} from '@rocket.chat/media-signaling';
import { useStream, useUserAvatarPath, useWriteStream } from '@rocket.chat/ui-contexts';
import { useEffect, useSyncExternalStore, useReducer, useMemo, useCallback, useRef } from 'react';

import { useCallSounds } from './useCallSounds';
import type { PeerInfo, State } from '../v2/MediaCallContext';

// TODO remove this once the permission flow PR is merged
export async function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
	if (navigator.mediaDevices === undefined) {
		throw new Error('Media devices not available in insecure contexts.');
	}

	return navigator.mediaDevices.getUserMedia.call(navigator.mediaDevices, constraints);
}

class WebRTCProcessor extends MediaCallWebRTCProcessor {
	constructor(config: WebRTCProcessorConfig) {
		super(config);
	}

	public async replaceSenderTrack(track: MediaStreamTrack) {
		// Not sure how we'd go about replacing the tracks, if there can be more than one track/sender.
		const sender = this.peer.getSenders().find((sender) => sender.track?.kind === track.kind);
		if (sender) {
			await sender.replaceTrack(track);
		}
	}

	public toggleSenderTracks(enable: boolean) {
		const tracks = this.peer.getSenders().map((sender) => sender.track);
		tracks.forEach((track) => {
			if (!track) {
				return;
			}
			track.enabled = enable;
		});
	}

	// TODO: This is to implement "hold", but we also need to send a signal which is not sent yet.
	public toggleReceiverTracks(enable: boolean) {
		const tracks = this.peer.getReceivers().map((receiver) => receiver.track);
		tracks.forEach((track) => {
			if (!track) {
				return;
			}
			track.enabled = enable;
		});
	}

	public stopAllTracks() {
		const senderTracks = this.peer.getSenders().map((sender) => sender.track);
		const receiverTracks = this.peer.getReceivers().map((receiver) => receiver.track);
		[...senderTracks, ...receiverTracks].forEach((track) => {
			if (!track) {
				return;
			}
			track.stop();
		});
	}
}

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

type SessionInfo = EmptySession | CallSession;

const defaultSessionInfo: SessionInfo = {
	state: 'closed' as const,
	peerInfo: undefined,
	muted: false,
	held: false,
	startedAt: new Date(),
};

type MediaSession = SessionInfo & {
	toggleMute: () => void;
	toggleHold: () => void;

	toggleWidget: (peerInfo?: PeerInfo) => void;
	selectPeer: (peerInfo: PeerInfo) => void;

	endCall: () => void;
	startCall: (id?: string, kind?: 'user' | 'sip') => Promise<void>;

	// changeDevice: (device: string) => void;
	changeDevice: (newTrack: MediaStreamTrack) => void;
	// changeDevice: (mediaStream: MediaStream) => void;
	forwardCall: () => void;
	sendTone: (tone: string) => void;
};

type SignalTransport = MediaSignalTransport<ClientMediaSignal>;

class MediaSessionStore extends Emitter<{ change: void }> {
	private sessionInstance: MediaSignalingSession | null = null;

	private sendSignalFn: SignalTransport | null = null;

	private _webrtcProcessorFactory: ((config: WebRTCProcessorConfig) => WebRTCProcessor) | null = null;

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
			mediaStreamFactory: getUserMedia,
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

	public setWebRTCProcessorFactory(factory: (config: WebRTCProcessorConfig) => WebRTCProcessor) {
		this._webrtcProcessorFactory = factory;
	}
}

const deriveWidgetStateFromCallState = (callState: CallState, callRole: CallRole): State | undefined => {
	switch (callState) {
		case 'active':
		case 'accepted':
			return 'ongoing';
		case 'none':
		case 'ringing':
			return callRole === 'callee' ? 'ringing' : 'calling';
	}
};

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

	const processor = useRef<WebRTCProcessor | undefined>(undefined);

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
		mediaSession.setWebRTCProcessorFactory((config) => {
			const _processor = new WebRTCProcessor(config);
			processor.current = _processor;
			return _processor;
		});
	}, []);

	return {
		instance: instance ?? undefined,
		processor: processor.current,
	};
};

const reducer = (
	reducerState: SessionInfo,
	action: {
		type: 'mute' | 'hold' | 'toggleWidget' | 'selectPeer' | 'instance_updated' | 'reset';
		payload?: Partial<SessionInfo>;
	},
): SessionInfo => {
	if (action.type === 'mute') {
		return {
			...reducerState,
			muted: !reducerState.muted,
		};
	}

	if (action.type === 'hold') {
		return {
			...reducerState,
			held: !reducerState.held,
		};
	}

	if (action.type === 'toggleWidget') {
		if (reducerState.state === 'closed') {
			return { ...reducerState, state: 'new', peerInfo: action.payload?.peerInfo };
		}

		if (reducerState.state === 'new') {
			return { ...reducerState, state: 'closed' };
		}
	}

	if (action.type === 'instance_updated') {
		return { ...reducerState, ...action.payload } as SessionInfo;
	}

	if (action.type === 'selectPeer') {
		if (reducerState.state !== 'new') {
			return reducerState;
		}

		return { ...reducerState, peerInfo: action.payload?.peerInfo };
	}

	if (action.type === 'reset') {
		return defaultSessionInfo;
	}

	return reducerState;
};

export const useMediaSession = (instance?: MediaSignalingSession, processor?: WebRTCProcessor): MediaSession => {
	const [mediaSession, dispatch] = useReducer<typeof reducer>(reducer, defaultSessionInfo);

	const getAvatarUrl = useUserAvatarPath();

	useEffect(() => {
		if (!instance) {
			dispatch({ type: 'reset' });
			return;
		}

		const updateSessionState = () => {
			const mainCall = instance.getMainCall();

			if (!mainCall) {
				dispatch({ type: 'reset' });
				return;
			}

			const { contact, state: callState, role } = mainCall;
			const state = deriveWidgetStateFromCallState(callState, role);

			if (contact.type === 'sip') {
				dispatch({ type: 'instance_updated', payload: { peerInfo: { number: contact.id || 'unknown' }, state } });
				return;
			}

			const avatarUrl = (() => {
				if (contact.avatarUrl) {
					return contact.avatarUrl;
				}

				if (contact.username) {
					return getAvatarUrl({ username: contact.username });
				}

				if (contact.id) {
					return getAvatarUrl({ userId: contact.id });
				}

				return undefined;
			})();

			const peerInfo = {
				displayName: contact.displayName,
				userId: contact.id,
				username: contact.username,
				avatarUrl,
				callerId: contact.sipExtension,
			} as PeerInfo; // TODO: Some of these fields are typed as optional, but I think they are always present.
			// Also as of now, there is no sip calls to handle.

			dispatch({ type: 'instance_updated', payload: { state, peerInfo } });
		};

		const offCbs = [
			instance.on('newCall', updateSessionState),
			instance.on('acceptedCall', updateSessionState),
			instance.on('endedCall', () => {
				processor?.stopAllTracks();
				updateSessionState();
			}),
			instance.on('callStateChange', updateSessionState),
			instance.on('callContactUpdate', updateSessionState),
		];

		return () => {
			offCbs.forEach((off) => off());
		};
	}, [getAvatarUrl, instance, processor]);

	useCallSounds(
		mediaSession.state,
		useCallback(
			(callback) => {
				if (!instance) {
					return;
				}
				return instance.on('endedCall', () => callback());
			},
			[instance],
		),
	);

	useEffect(() => {
		if (!processor) {
			return;
		}

		const micMuted = mediaSession.muted || mediaSession.held;

		processor.toggleSenderTracks(!micMuted);
		processor.toggleReceiverTracks(!mediaSession.held);
	}, [mediaSession.muted, mediaSession.held, processor]);

	const cbs = useMemo(() => {
		const toggleWidget = (peerInfo?: PeerInfo) => {
			dispatch({ type: 'toggleWidget', payload: { peerInfo } });
		};

		const selectPeer = (peerInfo: PeerInfo) => {
			dispatch({ type: 'selectPeer', payload: { peerInfo } });
		};

		const toggleMute = () => {
			dispatch({ type: 'mute' });
		};

		const toggleHold = () => {
			dispatch({ type: 'hold' });
		};

		const endCall = () => {
			if (!instance) {
				return;
			}

			const mainCall = instance.getMainCall();
			if (!mainCall) {
				return;
			}

			const { role } = mainCall;

			if (role === 'caller' || mainCall.state !== 'ringing') {
				mainCall.hangup();
				return;
			}

			mainCall.reject();
		};

		const startCall = async (id?: string, kind?: 'user' | 'sip') => {
			// console.log('startCall', id, kind, instance);
			if (!instance) {
				return;
			}

			const call = instance.getMainCall();
			// console.log({ ...call });
			if (call && call.state === 'ringing') {
				// console.log('accepting call');
				call.accept();
				return;
			}

			if (!id || !kind) {
				throw new Error('ID and kind are required');
			}

			try {
				await instance.startCall(kind, id);
			} catch (error) {
				console.error(error);
			}
		};

		// TODO not sure between getting the track or device/stream.
		const changeDevice = (newTrack: MediaStreamTrack) => {
			try {
				processor?.replaceSenderTrack(newTrack);
			} catch (error) {
				console.error(error);
			}
		};

		const forwardCall = () => {
			// dispatch({ type: 'forwardCall' });
		};

		const sendTone = (_tone: string) => {
			// dispatch({ type: 'sendTone', payload: { tone } });
		};

		return {
			toggleWidget,
			toggleHold,
			endCall,
			startCall,
			changeDevice,
			forwardCall,
			sendTone,
			selectPeer,
			toggleMute,
		};
	}, [instance, processor]);

	return {
		...mediaSession,
		...cbs,
	};
};
