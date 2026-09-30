import type { MediaSignalingSession, CallState, CallContact } from '@rocket.chat/media-signaling';
import { useUserAvatarPath, useUserPresence } from '@rocket.chat/ui-contexts';
import { useMemo, useSyncExternalStore } from 'react';

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

type AvatarUrlGetter = ReturnType<typeof useUserAvatarPath>;

const deriveSessionState = (instance: MediaSignalingSession | undefined, getAvatarUrl: AvatarUrlGetter): SessionState => {
	const instanceState = instance?.getState();
	if (!instanceState) {
		return defaultSessionState;
	}

	const {
		state: callState,
		localParticipant: { role, muted, held },
	} = instanceState;
	const state = deriveWidgetStateFromCallState(callState, role);

	if (!state) {
		return defaultSessionState;
	}

	const connectionState = deriveConnectionStateFromCallState(callState);

	if (!instanceState.confirmed) {
		return {
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
			confirmed: instanceState.confirmed,
		};
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

	const avatarUrl = (() => {
		if (contact.username) {
			return getAvatarUrl({ username: contact.username });
		}

		if (contact.type === 'user' && contact.id) {
			return getAvatarUrl({ userId: contact.id });
		}

		return undefined;
	})();

	return {
		state,
		peerInfo: {
			...derivePeerInfoFromInstanceContact(contact),
			avatarUrl,
		},
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
		confirmed: instanceState.confirmed,
	};
};

/** A store over the session's call state whose snapshot only changes when the session reports a change. */
const createSessionStore = (instance: MediaSignalingSession | undefined, getAvatarUrl: AvatarUrlGetter) => {
	let snapshot: SessionState | undefined;

	return {
		subscribe: (onStoreChange: () => void) => {
			if (!instance) {
				return () => undefined;
			}

			const handleChange = () => {
				snapshot = undefined;
				onStoreChange();
			};

			const offCbs = [instance.on('sessionStateChange', handleChange), instance.on('hiddenCall', handleChange)];

			// the session may have changed between the first render and this subscription
			handleChange();

			return () => {
				offCbs.forEach((offCb) => offCb());
			};
		},
		getSnapshot: (): SessionState => {
			snapshot ??= deriveSessionState(instance, getAvatarUrl);
			return snapshot;
		},
	};
};

export const useMediaSession = (instance?: MediaSignalingSession): SessionState => {
	const getAvatarUrl = useUserAvatarPath();

	const { subscribe, getSnapshot } = useMemo(() => createSessionStore(instance, getAvatarUrl), [instance, getAvatarUrl]);

	const sessionState = useSyncExternalStore(subscribe, getSnapshot);

	const peerUserId = sessionState.peerInfo && 'userId' in sessionState.peerInfo ? sessionState.peerInfo.userId : undefined;
	const peerStatus = useUserPresence(peerUserId)?.status;

	return useMemo(() => {
		if (!peerStatus || !sessionState.peerInfo || !('userId' in sessionState.peerInfo)) {
			return sessionState;
		}

		return { ...sessionState, peerInfo: { ...sessionState.peerInfo, status: peerStatus } };
	}, [sessionState, peerStatus]);
};
