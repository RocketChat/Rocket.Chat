import { Emitter } from '@rocket.chat/emitter';
import {
	CallContact,
	MediaSignal,
	MediaSignalingSession,
	MediaCallWebRTCProcessor,
	MediaSignalTransport,
	CallState,
	CallRole,
} from '@rocket.chat/media-signaling';
import { useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { useEffect, useSyncExternalStore, useReducer, useMemo, useCallback } from 'react';

import { getUserMedia } from '../lib/getUserMedia';
import type { State } from '../v2/MediaCallContext';

type SessionInfo = {
	state: State;
	contact: CallContact;

	muted: boolean;
	held: boolean;
	startedAt: Date | null; // todo not sure if I need this
};

const defaultSessionInfo: SessionInfo = {
	state: 'closed' as const,
	contact: null,
	muted: false,
	held: false,
	startedAt: new Date(),
};

type MediaSession = SessionInfo & {
	toggleMute: () => void;
	toggleHold: () => void;

	toggleWidget: () => void;

	endCall: () => void;
	startCall: (id?: string, kind?: 'user' | 'extension') => void;

	changeDevice: (device: string) => void;
	forwardCall: () => void;
	sendTone: (tone: string) => void;
};

class MediaSessionStore extends Emitter<{ change: void }> {
	private sessionInstance: MediaSignalingSession | null = null;

	private sendSignalFn: MediaSignalTransport | null = null;

	constructor() {
		super();
	}

	private change() {
		this.emit('change');
	}

	public onChange(callback: () => void) {
		return this.on('change', callback);
	}

	private sendSignal(signal: MediaSignal) {
		if (this.sendSignalFn) {
			return this.sendSignalFn(signal);
		}

		console.warn('Media Call - Tried to send signal, but no sendSignalFn was set');
		return Promise.resolve();
	}

	private makeInstance(userId: string) {
		this.sessionInstance = new MediaSignalingSession({
			userId,
			transport: (signal: MediaSignal) => this.sendSignal(signal),
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

	public setSendSignalFn(sendSignalFn: MediaSignalTransport) {
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

	const mediaCallsSignal = useEndpoint('POST', '/v1/media-calls.signal');
	const notifyUserStream = useStream('notify-user');

	useEffect(() => {
		return mediaSession.setSendSignalFn((signal: MediaSignal) => mediaCallsSignal({ signal }));
	}, [mediaCallsSignal]);

	useEffect(() => {
		if (!instance) {
			return;
		}

		const unsubNotification = notifyUserStream(`${instance.userId}/media-signal`, (signal: MediaSignal) => instance.processSignal(signal));

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
	console.log({ action, prevState: reducerState });
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
	const startCallEndpoint = useEndpoint('POST', '/v1/media-calls.start');

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

		const startCall = async (id?: string, kind?: 'user' | 'extension') => {
			if (!instance) {
				console.log('No instance');
				return;
			}

			const call = instance.getMainCall();
			if (call && call.state === 'ringing') {
				console.log('Accepting call');
				call.accept();
				return;
			}

			if (!id || !kind) {
				throw new Error('ID and kind are required');
			}

			try {
				console.log('Starting call');
				const { call } = await startCallEndpoint({ sessionId: instance.sessionId, identifier: id, identifierKind: kind });
				console.log('Call started', call);
				const { _id: callId, callee } = call;
				instance.registerOutboundCall(callId, callee);
				console.log('Call registered', callId, callee);
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
	}, [instance, startCallEndpoint]);

	return {
		...mediaSession,
		...cbs,
	};
};
