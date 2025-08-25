// import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
// import { usePermission /* , useUserId */ } from '@rocket.chat/ui-contexts';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useMediaCallContext /* useVoipAPI, useVoipState */ } from '@rocket.chat/ui-voip';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaPermissions } from '../../views/room/composer/messageBox/hooks/useMediaPermissions';
import { useRoom } from '../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const getPeerId = (uids: string[], ownUserId: string | null) => {
	if (!ownUserId) {
		return undefined;
	}

	const otherIds = uids.filter((uid) => uid !== ownUserId);

	// If no id, it's an one user DM. If more than one, it's a group dm. Both are not supported as of now.
	if (otherIds.length === 0 || otherIds.length > 1) {
		return undefined;
	}

	return otherIds[0];
};

export const useMediaCallRoomAction = () => {
	const { t } = useTranslation();
	const { uids = [] } = useRoom();
	const ownUserId = useUserId();
	// const canStartVoiceCall = usePermission('view-user-voip-extension');

	const [isMicPermissionDenied] = useMediaPermissions('microphone');

	const { state, onCall } = useMediaCallContext();

	const isInCall = state !== 'closed' && state !== 'new';
	const disabled = isMicPermissionDenied || isInCall;
	// const allowed = canStartVoiceCall && !isInCall;
	// const canMakeVoipCall = allowed && !isMicPermissionDenied;

	const tooltip = useMemo(() => {
		if (isMicPermissionDenied) {
			return t('Microphone_access_not_allowed');
		}

		if (isInCall) {
			return t('Unable_to_make_calls_while_another_is_ongoing');
		}

		return disabled ? t('Voice_calling_disabled') : t('Voice_Call');
	}, [disabled, isMicPermissionDenied, isInCall, t]);

	const peerId = getPeerId(uids, ownUserId);

	// TODO: Implement call in progress ("loading")
	// TODO: Implement hangup call
	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!peerId) {
			return undefined;
		}

		return {
			id: 'start-voice-call',
			title: 'Voice_Call',
			icon: 'phone',
			featured: true,
			action: () => onCall(peerId, 'user'),
			groups: ['direct'] as const,
			disabled,
			tooltip,
		};
	}, [peerId, disabled, tooltip, onCall]);
};
