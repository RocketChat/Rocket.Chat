import type { UserStatus } from '@rocket.chat/core-typings';
import type { MediaSignalingSession, CallState, CallContact } from '@rocket.chat/media-signaling';
import { useUserAvatarPath, useUserPresence } from '@rocket.chat/ui-contexts';
import { useCallback, useRef } from 'react';

import type { ConnectionState, SessionState } from '../context/definitions';
import { derivePeerInfoFromInstanceContact } from '../utils/derivePeerInfoFromInstanceContact';
import { deriveWidgetStateFromCallState } from '../utils/deriveWidgetStateFromCallState';

export const defaultSessionInfo: SessionState = {
	state: 'none' as const,
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

export type MediaSessionStateSubscription = {
	subscribe: (onStoreChange: () => void) => () => void;
	getSnapshot: () => SessionState;
};

type GetStateParams = {
	instance: MediaSignalingSession | undefined;
	status?: UserStatus;
	getAvatarUrl: ReturnType<typeof useUserAvatarPath>;
};

const getState = ({ instance, status, getAvatarUrl }: GetStateParams): SessionState | undefined => {
	if (!instance) {
		return undefined;
	}

	const instanceState = instance.getState();
	if (!instanceState) {
		return undefined;
	}

	const {
		state: callState,
		localParticipant: { role, muted, held },
	} = instanceState;
	const state = deriveWidgetStateFromCallState(callState, role);

	if (!state) {
		return undefined;
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

	if (contact.type === 'sip') {
		return {
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
		};
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

	const peerInfo = { ...derivePeerInfoFromInstanceContact(contact), avatarUrl, status };

	return {
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
	};
};

export const useMediaSessionStateSubscription = (instance?: MediaSignalingSession): MediaSessionStateSubscription => {
	const cacheRef = useRef<SessionState>(defaultSessionInfo);

	const getAvatarUrl = useUserAvatarPath();

	const presence = useUserPresence(
		cacheRef.current?.peerInfo && 'userId' in cacheRef.current.peerInfo ? cacheRef.current.peerInfo.userId : undefined,
	);

	const { status } = presence || {};

	const subscribe = useCallback(
		(onStoreChange: () => void): (() => void) => {
			if (!instance) {
				return () => undefined;
			}
			const onEvent = () => {
				const newState = getState({ instance, status, getAvatarUrl });
				if (!newState) {
					cacheRef.current = defaultSessionInfo;
				} else {
					cacheRef.current = { ...cacheRef.current, ...newState };
				}
				if (newState === cacheRef.current) {
					return;
				}
				onStoreChange();
			};
			const offCbs = [instance.on('sessionStateChange', onEvent), instance.on('hiddenCall', onEvent)];
			return () => offCbs.forEach((cb) => cb());
		},
		[getAvatarUrl, instance, status],
	);

	const getSnapshot = useCallback(() => {
		return cacheRef.current;
	}, []);

	return {
		subscribe,
		getSnapshot,
	};
};
