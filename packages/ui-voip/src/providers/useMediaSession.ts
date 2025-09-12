import { MediaSignalingSession, CallState, CallRole } from '@rocket.chat/media-signaling';
import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { useEffect, useReducer, useMemo } from 'react';

import type { SessionInfo } from './useMediaSessionInstance';
import type { PeerInfo, State } from '../v2/MediaCallContext';

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
	startCall: (id: string, kind: 'user' | 'sip', track: MediaStreamTrack) => Promise<void>;
	acceptCall: (track: MediaStreamTrack) => Promise<void>;

	changeDevice: (newTrack: MediaStreamTrack) => Promise<void>;

	forwardCall: () => void;
	sendTone: (tone: string) => void;
};

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

const reducer = (
	reducerState: SessionInfo,
	action: {
		type: 'toggleWidget' | 'selectPeer' | 'instance_updated' | 'reset' | 'mute' | 'hold';
		payload?: Partial<SessionInfo>;
	},
): SessionInfo => {
	if (action.type === 'mute') {
		return {
			...reducerState,
			muted: action.payload?.muted ?? reducerState.muted,
		};
	}

	if (action.type === 'hold') {
		return {
			...reducerState,
			held: action.payload?.held ?? reducerState.held,
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

export const useMediaSession = (instance?: MediaSignalingSession): MediaSession => {
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

			const { contact, state: callState, role, muted, held } = mainCall;
			const state = deriveWidgetStateFromCallState(callState, role);

			if (contact.type === 'sip') {
				dispatch({ type: 'instance_updated', payload: { peerInfo: { number: contact.id || 'unknown' }, state, muted, held } });
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

			dispatch({ type: 'instance_updated', payload: { state, peerInfo, muted, held } });
		};

		const offCbs = [
			instance.on('callContactUpdate', updateSessionState),
			instance.on('callStateChange', updateSessionState),
			// instance.on('callClientStateChange', updateSessionState),
			instance.on('newCall', updateSessionState),
			instance.on('acceptedCall', updateSessionState),
			instance.on('activeCall', updateSessionState),
			instance.on('endedCall', updateSessionState),
		];

		return () => {
			offCbs.forEach((off) => off());
		};
	}, [getAvatarUrl, instance]);

	const cbs = useMemo(() => {
		const toggleWidget = (peerInfo?: PeerInfo) => {
			dispatch({ type: 'toggleWidget', payload: { peerInfo } });
		};

		const selectPeer = (peerInfo: PeerInfo) => {
			dispatch({ type: 'selectPeer', payload: { peerInfo } });
		};

		const toggleMute = () => {
			const mainCall = instance?.getMainCall();
			if (!mainCall) {
				return;
			}

			mainCall.setMuted(!mainCall.muted);

			dispatch({ type: 'mute', payload: { muted: mainCall.muted } });
		};

		const toggleHold = () => {
			const mainCall = instance?.getMainCall();
			if (!mainCall) {
				return;
			}

			mainCall.setHeld(!mainCall.held);

			dispatch({ type: 'hold', payload: { held: mainCall.held } });
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

		const acceptCall = async (track: MediaStreamTrack) => {
			if (!instance) {
				return;
			}

			const call = instance.getMainCall();
			if (!call || call.state !== 'ringing') {
				return;
			}

			await call.setInputTrack(track);
			call.accept();
		};

		const startCall = async (id: string, kind: 'user' | 'sip', inputTrack: MediaStreamTrack) => {
			if (!instance) {
				return;
			}

			try {
				await instance.startCall(kind, id, { inputTrack });
			} catch (error) {
				console.error('Error starting call', error);
			}
		};

		const changeDevice = async (newTrack: MediaStreamTrack) => {
			const mainCall = instance?.getMainCall();
			if (!mainCall) {
				return;
			}

			await mainCall.setInputTrack(newTrack);
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
			acceptCall,
		};
	}, [instance]);

	return {
		...mediaSession,
		...cbs,
	};
};
