import type { UserStatus } from '@rocket.chat/core-typings';
import type { MediaSignalingSession, CallState, CallContact } from '@rocket.chat/media-signaling';
import { useUserAvatarPath, useUserPresence } from '@rocket.chat/ui-contexts';
import { useEffect, useReducer } from 'react';

import { defaultSessionState } from '../context/MediaCallViewContext';
import type { ConnectionState, SessionState } from '../context/definitions';
import { derivePeerInfoFromInstanceContact } from '../utils/derivePeerInfoFromInstanceContact';
import { deriveWidgetStateFromCallState } from '../utils/deriveWidgetStateFromCallState';

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
				type: 'instance_updated';
				payload: SessionState;
		  }
		| {
				type: 'status_updated';
				payload?: { status?: UserStatus };
		  },
): SessionState => {
	if (action.type === 'instance_updated') {
		return { ...reducerState, ...action.payload };
	}

	if (action.type === 'reset') {
		return defaultSessionState;
	}

	if (action.type === 'status_updated' && reducerState.peerInfo && 'userId' in reducerState.peerInfo) {
		return { ...reducerState, peerInfo: { ...reducerState.peerInfo, status: action.payload?.status } };
	}

	return reducerState;
};

export const useMediaSession = (instance?: MediaSignalingSession): SessionState => {
	const [mediaSession, dispatch] = useReducer(reducer, defaultSessionState);

	const getAvatarUrl = useUserAvatarPath();

	useEffect(() => {
		if (!instance) {
			dispatch({ type: 'reset' });
			return;
		}

		const updateSessionState = () => {
			const instanceState = instance.getState();
			if (!instanceState) {
				dispatch({ type: 'reset' });
				return;
			}

			const {
				state: callState,
				localParticipant: { role, muted, held },
			} = instanceState;
			const state = deriveWidgetStateFromCallState(callState, role);

			if (!state) {
				dispatch({ type: 'reset' });
				return;
			}

			const connectionState = deriveConnectionStateFromCallState(callState);

			if (!instanceState.confirmed) {
				dispatch({
					type: 'instance_updated',
					payload: {
						peerInfo: {
							displayName: instanceState.title,
							userId: 'unknown',
							username: undefined,
							callerId: undefined,
						},
						transferredBy: undefined,
						state,
						muted,
						held,
						connectionState,
						hidden: false,
						remoteHeld: false,
						remoteMuted: false,
						callId: instanceState.tempCallId,
						startedAt: undefined,
						supportedFeatures: [],
					},
				});
				return;
			}

			const {
				hidden,
				callId,
				activeTimestamp: startedAt,
				features: supportedFeatures,
				transferredBy: callTransferredBy,
				remoteParticipant: { muted: remoteMuted, held: remoteHeld, contact },
			} = instanceState;

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
						remoteMuted,
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
					remoteMuted,
					callId,
					startedAt,
					supportedFeatures,
				},
			});
		};

		const offCbs = [instance.on('sessionStateChange', updateSessionState), instance.on('hiddenCall', updateSessionState)];

		updateSessionState();

		return () => {
			offCbs.forEach((offCb) => offCb());
		};
	}, [getAvatarUrl, instance]);

	const status = useUserPresence(mediaSession.peerInfo && 'userId' in mediaSession.peerInfo ? mediaSession.peerInfo.userId : undefined);

	useEffect(() => {
		if (status?.status) {
			dispatch({ type: 'status_updated', payload: { status: status.status } });
		}
	}, [status?.status]);

	return mediaSession;
};
