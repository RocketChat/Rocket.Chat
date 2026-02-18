import type { UserStatus } from '@rocket.chat/core-typings';
import type { MediaSignalingSession, CallState, CallRole } from '@rocket.chat/media-signaling';
import { useUserAvatarPath, useUserPresence } from '@rocket.chat/ui-contexts';
import { useEffect, useReducer, useMemo, useCallback } from 'react';

import type { ConnectionState, PeerInfo, State, SessionState } from './MediaCallContext';

const defaultSessionInfo: SessionState = {
	state: 'closed' as const,
	callId: undefined,
	connectionState: 'CONNECTING' as const,
	peerInfo: undefined,
	transferredBy: undefined,
	muted: false,
	held: false,
	remoteMuted: false,
	remoteHeld: false,
	startedAt: new Date(),
	hidden: false,
};

export const getExtensionFromPeerInfo = (peerInfo: PeerInfo): string | undefined => {
	if ('callerId' in peerInfo) {
		return peerInfo.callerId;
	}

	if ('number' in peerInfo) {
		return peerInfo.number;
	}

	return undefined;
};

const deriveWidgetStateFromCallState = (
	callState: CallState,
	callRole: CallRole,
): Extract<State, 'ongoing' | 'ringing' | 'calling'> | undefined => {
	switch (callState) {
		case 'active':
		case 'accepted':
		case 'renegotiating':
			return 'ongoing';
		case 'none':
		case 'ringing':
			return callRole === 'callee' ? 'ringing' : 'calling';
		default:
			return undefined;
	}
};

const deriveConnectionStateFromCallState = (callState: CallState): ConnectionState => {
	switch (callState) {
		case 'renegotiating':
			return 'RECONNECTING';
		case 'ringing':
		case 'active':
			return 'CONNECTED';
		case 'none':
		case 'accepted':
		default:
			return 'CONNECTING';
	}
};

const reducer = (
	reducerState: SessionState,
	action: {
		type: 'toggleWidget' | 'selectPeer' | 'instance_updated' | 'status_updated' | 'reset' | 'mute' | 'hold';
		payload?: Partial<SessionState> & { status?: UserStatus };
	},
): SessionState => {
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
		return { ...reducerState, ...action.payload } as SessionState;
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

export type MediaSessionStateWithWidgetControls = {
	sessionState: SessionState;
	toggleWidget: (peerInfo?: PeerInfo) => void;
	selectPeer: (peerInfo: PeerInfo) => void;
};

export const useMediaSession = (instance?: MediaSignalingSession): MediaSessionStateWithWidgetControls => {
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

			const {
				contact,
				transferredBy: callTransferredBy,
				state: callState,
				role,
				muted,
				held,
				hidden,
				remoteHeld,
				remoteMute,
				callId,
			} = mainCall;
			const state = deriveWidgetStateFromCallState(callState, role);
			const connectionState = deriveConnectionStateFromCallState(callState);

			const transferredBy = callTransferredBy?.displayName || callTransferredBy?.username || undefined;

			if (contact.type === 'sip') {
				dispatch({
					type: 'instance_updated',
					payload: {
						peerInfo: { number: contact.id || 'unknown' },
						transferredBy,
						state,
						muted,
						held,
						connectionState,
						hidden,
						remoteHeld,
						remoteMuted: remoteMute,
						callId,
					},
				});
				return;
			}

			const avatarUrl = (() => {
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
			} as PeerInfo;

			dispatch({
				type: 'instance_updated',
				payload: { state, peerInfo, transferredBy, muted, held, connectionState, hidden, remoteHeld, remoteMuted: remoteMute, callId },
			});
		};

		const offCbs = [instance.on('sessionStateChange', updateSessionState), instance.on('hiddenCall', updateSessionState)];

		return () => {
			offCbs.forEach((offCb) => offCb());
		};
	}, [getAvatarUrl, instance]);

	const toggleWidget = useCallback((peerInfo?: PeerInfo) => {
		dispatch({ type: 'toggleWidget', payload: { peerInfo } });
	}, []);

	const selectPeer = useCallback((peerInfo: PeerInfo) => {
		dispatch({ type: 'selectPeer', payload: { peerInfo } });
	}, []);

	const status = useUserPresence(mediaSession.peerInfo && 'userId' in mediaSession.peerInfo ? mediaSession.peerInfo.userId : undefined);

	const peerInfo = useMemo(() => {
		return mediaSession.peerInfo ? { ...mediaSession.peerInfo, status: status?.status } : undefined;
	}, [mediaSession.peerInfo, status]);

	const sessionState: SessionState = useMemo(
		() => ({
			...mediaSession,
			peerInfo: peerInfo!, // TODO: fix this. Since it comes from the useMemo, there's no relation with the state, so types fail
			startedAt: mediaSession.startedAt ?? undefined,
		}),
		[mediaSession, peerInfo],
	);

	return {
		sessionState,
		toggleWidget,
		selectPeer,
	};
};
