// import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
// import { usePermission /* , useUserId */ } from '@rocket.chat/ui-contexts';
import { useMediaCallContext /* useVoipAPI, useVoipState */ } from '@rocket.chat/ui-voip';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaPermissions } from '../../../views/room/composer/messageBox/hooks/useMediaPermissions';
import type { RoomToolboxActionConfig } from '../../../views/room/contexts/RoomToolboxContext';

export const useMediaCallAction = () => {
	const { t } = useTranslation();
	// const { uids = [] } = useRoom();
	// const ownUserId = useUserId();
	// const canStartVoiceCall = usePermission('view-user-voip-extension');

	const [isMicPermissionDenied] = useMediaPermissions('microphone');

	const { state, onToggleWidget } = useMediaCallContext();

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

	// TODO: Implement call in progress ("loading")
	// TODO: Implement hangup call
	return useMemo((): RoomToolboxActionConfig => {
		return {
			id: 'start-voice-call',
			title: 'Voice_Call',
			icon: 'phone',
			featured: true,
			action: onToggleWidget,
			groups: ['direct'] as const,
			disabled,
			tooltip,
		};
	}, [disabled, tooltip, onToggleWidget]);
};
