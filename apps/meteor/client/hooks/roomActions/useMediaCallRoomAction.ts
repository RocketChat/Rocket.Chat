// import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { usePermission /* , useUserId */ } from '@rocket.chat/ui-contexts';
import { useMediaCallContext /* useVoipAPI, useVoipState */ } from '@rocket.chat/ui-voip';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaPermissions } from '../../views/room/composer/messageBox/hooks/useMediaPermissions';
// import { useRoom } from '../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';
// import { useUserInfoQuery } from '../useUserInfoQuery';
// import { useVoipWarningModal } from '../useVoipWarningModal';

export const useMediaCallRoomAction = () => {
	const { t } = useTranslation();
	// const { uids = [] } = useRoom();
	// const ownUserId = useUserId();
	const canStartVoiceCall = usePermission('view-user-voip-extension');
	// const dispatchWarning = useVoipWarningModal();

	const [isMicPermissionDenied] = useMediaPermissions('microphone');

	// const { isEnabled, isRegistered, isInCall } = useVoipState();
	// const { makeCall } = useVoipAPI();

	const { state, onToggleWidget } = useMediaCallContext();

	// const members = useMemo(() => uids.filter((uid) => uid !== ownUserId), [uids, ownUserId]);
	// const remoteUserId = members[0];

	// const { data: { user: remoteUser } = {}, isPending } = useUserInfoQuery({ userId: remoteUserId }, { enabled: Boolean(remoteUserId) });

	// const isRemoteRegistered = !!remoteUser?.freeSwitchExtension;

	const isInCall = state !== 'closed' && state !== 'new';
	const disabled = isMicPermissionDenied || isInCall;
	const allowed = canStartVoiceCall && !isInCall;
	// const canMakeVoipCall = allowed && !isMicPermissionDenied;

	const tooltip = useMemo(() => {
		if (isMicPermissionDenied) {
			return t('Microphone_access_not_allowed');
		}

		if (isInCall) {
			return t('Unable_to_make_calls_while_another_is_ongoing');
		}

		return disabled ? t('Voice_calling_disabled') : '';
	}, [disabled, isMicPermissionDenied, isInCall, t]);

	// const handleOnClick = useEffectEvent(() => {
	// 	if (canMakeVoipCall) {
	// 		return makeCall(remoteUser?.freeSwitchExtension as string);
	// 	}
	// 	dispatchWarning();
	// });

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!allowed) {
			return undefined;
		}

		return {
			id: 'start-voice-call2',
			title: 'Voice_Call',
			icon: 'phone-disabled',
			featured: true,
			action: onToggleWidget,
			groups: ['direct'] as const,
			disabled,
			tooltip,
		};
	}, [allowed, disabled, tooltip, onToggleWidget]);
};
