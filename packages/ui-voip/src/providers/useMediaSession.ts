import type { UserStatus } from '@rocket.chat/core-typings';
import type { MediaSignalingSession, CallState, CallContact } from '@rocket.chat/media-signaling';
import { useUserAvatarPath, useUserPresence } from '@rocket.chat/ui-contexts';
import { useEffect, useReducer, useCallback } from 'react';

import type { ConnectionState, PeerInfo, SessionState } from '../context/definitions';
import { derivePeerInfoFromInstanceContact } from '../utils/derivePeerInfoFromInstanceContact';
import { deriveWidgetStateFromCallState } from '../utils/deriveWidgetStateFromCallState';

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
	startedAt: undefined,
	hidden: false,
	supportedFeatures: ['audio', 'transfer', 'hold'],
};

export const getExtensionFromInstanceContact = (contact: CallContact): string | undefined => {
	if (contact.type === 'sip') {
		return contact.id;
	}

	return contact.sipExtension;
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
	action:
		| {
				type: 'reset';
		  }
		| {
				type: 'selectPeer';
				payload: { peerInfo?: PeerInfo };
		  }
		| {
				type: 'toggleWidget';
				payload: { peerInfo?: PeerInfo };
		  }
		| {
				type: 'instance_updated';
				payload: SessionState;
		  }
		| {
				type: 'status_updated';
				payload?: { status?: UserStatus };
		  },
): SessionState => {
	if (action.type === 'toggleWidget') {
		if (reducerState.state === 'closed') {
			return { ...reducerState, state: 'new', peerInfo: action.payload?.peerInfo };
		}

		if (reducerState.state === 'new') {
			return { ...reducerState, state: 'closed' };
		}
	}

	if (action.type === 'instance_updated') {
		return { ...reducerState, ...action.payload };
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

	if (action.type === 'status_updated' && reducerState.peerInfo && 'userId' in reducerState.peerInfo) {
		return { ...reducerState, peerInfo: { ...reducerState.peerInfo, status: action.payload?.status } };
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
				activeTimestamp: startedAt,
				features: supportedFeatures,
			} = mainCall;
			const state = deriveWidgetStateFromCallState(callState, role);

			if (!state) {
				dispatch({ type: 'reset' });
				return;
			}

			const connectionState = deriveConnectionStateFromCallState(callState);

			const transferredBy = callTransferredBy?.displayName || callTransferredBy?.username || undefined;

			if (contact.type === 'sip') {
				dispatch({
					type: 'instance_updated',
					payload: {
						peerInfo: derivePeerInfoFromInstanceContact(contact),
						transferredBy,
						state,
						muted,
						held,
						connectionState,
						hidden,
						remoteHeld,
						remoteMuted: remoteMute,
						callId,
						startedAt,
						supportedFeatures,
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

			const peerInfo = { ...derivePeerInfoFromInstanceContact(contact), avatarUrl };

			dispatch({
				type: 'instance_updated',
				payload: {
					state,
					peerInfo,
					transferredBy,
					muted,
					held,
					connectionState,
					hidden,
					remoteHeld,
					remoteMuted: remoteMute,
					callId,
					startedAt,
					supportedFeatures,
				},
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

	useEffect(() => {
		if (status?.status) {
			dispatch({ type: 'status_updated', payload: { status: status.status } });
		}
	}, [status?.status]);

	return {
		sessionState: mediaSession,
		toggleWidget,
		selectPeer,
	};
};
