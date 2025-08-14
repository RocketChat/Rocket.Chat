import { Emitter } from '@rocket.chat/emitter';
import {
	CallContact,
	MediaSignalingSession,
	MediaCallWebRTCProcessor,
	MediaSignalTransport,
	CallState,
	CallRole,
	ClientMediaSignal,
	ServerMediaSignal,
} from '@rocket.chat/media-signaling';
import { useStream, useWriteStream } from '@rocket.chat/ui-contexts';
import { useEffect, useSyncExternalStore, useReducer, useMemo, useCallback } from 'react';

import { useCallSounds } from './useCallSounds';
import type { State } from '../v2/MediaCallContext';

// TODO remove this once the permission flow PR is merged
export async function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
	if (navigator.mediaDevices === undefined) {
		throw new Error('Media devices not available in insecure contexts.');
	}

	return navigator.mediaDevices.getUserMedia.call(navigator.mediaDevices, constraints);
}

type SessionInfo = {
	state: State;
	contact?: CallContact;

	muted: boolean;
	held: boolean;
	startedAt: Date | null; // todo not sure if I need this
};

const defaultSessionInfo: SessionInfo = {
	state: 'closed' as const,
	contact: undefined,
	muted: false,
	held: false,
	startedAt: new Date(),
};

type MediaSession = SessionInfo & {
	toggleMute: () => void;
	toggleHold: () => void;

	toggleWidget: () => void;

	endCall: () => void;
	startCall: (id?: string, kind?: 'user' | 'sip') => Promise<void>;

	changeDevice: (device: string) => void;
	forwardCall: () => void;
	sendTone: (tone: string) => void;
};

type SignalTransport = MediaSignalTransport<ClientMediaSignal>;

class MediaSessionStore extends Emitter<{ change: void }> {
	private sessionInstance: MediaSignalingSession | null = null;

	private sendSignalFn: SignalTransport | null = null;

	constructor() {
		super();
	}

	private change() {
		this.emit('change');
	}

	public onChange(callback: () => void) {
		return this.on('change', callback);
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
				webrtc: (config) => new MediaCallWebRTCProcessor(config),
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

	return instance ?? undefined;
};

const reducer = (
	reducerState: SessionInfo,
	action: { type: 'mute' | 'hold' | 'toggleWidget' | 'instance_updated' | 'reset'; payload?: Partial<SessionInfo> },
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
			return { ...reducerState, state: 'new' };
		}

		if (reducerState.state === 'new') {
			return { ...reducerState, state: 'closed' };
		}
	}

	if (action.type === 'instance_updated') {
		return { ...reducerState, ...action.payload };
	}

	if (action.type === 'reset') {
		return defaultSessionInfo;
	}

	return reducerState;
};

export const useMediaSession = (instance?: MediaSignalingSession): MediaSession => {
	const [mediaSession, dispatch] = useReducer<typeof reducer>(reducer, defaultSessionInfo);
	console.log('useMediaSession', mediaSession);
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

			dispatch({ type: 'instance_updated', payload: { state, contact } });
		};

		const offCbs = [
			instance.on('newCall', updateSessionState),
			instance.on('acceptedCall', updateSessionState),
			instance.on('endedCall', updateSessionState),
			instance.on('callStateChange', updateSessionState),
		];

		return () => {
			offCbs.forEach((off) => off());
		};
	}, [instance]);

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

	const cbs = useMemo(() => {
		const toggleWidget = () => {
			dispatch({ type: 'toggleWidget' });
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

			if (role === 'caller') {
				mainCall.hangup();
				return;
			}

			mainCall.reject();
		};

		const startCall = async (id?: string, kind?: 'user' | 'sip') => {
			console.log('startCall', id, kind, instance);
			if (!instance) {
				return;
			}

			const call = instance.getMainCall();
			console.log({ ...call });
			if (call && call.state === 'ringing') {
				console.log('accepting call');
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

		const changeDevice = (_device: string) => {
			// dispatch({ type: 'changeDevice', payload: { device } });
		};

		const forwardCall = () => {
			// dispatch({ type: 'forwardCall' });
		};

		const sendTone = (_tone: string) => {
			// dispatch({ type: 'sendTone', payload: { tone } });
		};

		return {
			toggleWidget,
			toggleMute,
			toggleHold,
			endCall,
			startCall,
			changeDevice,
			forwardCall,
			sendTone,
		};
	}, [instance]);

	return {
		...mediaSession,
		...cbs,
	};
};
