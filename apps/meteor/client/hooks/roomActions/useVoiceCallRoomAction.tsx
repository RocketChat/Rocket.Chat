import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { usePermission, useUserId } from '@rocket.chat/ui-contexts';
import { useVoipAPI, useVoipState } from '@rocket.chat/ui-voip';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaPermissions } from '../../views/room/composer/messageBox/hooks/useMediaPermissions';
import { useRoom } from '../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';
import { useUserInfoQuery } from '../useUserInfoQuery';
import { useVoipWarningModal } from '../useVoipWarningModal';

export const useVoiceCallRoomAction = () => {
	const { t } = useTranslation();
	const { uids = [] } = useRoom();
	const ownUserId = useUserId();
	const canStartVoiceCall = usePermission('view-user-voip-extension');
	const dispatchWarning = useVoipWarningModal();

	const [isMicPermissionDenied] = useMediaPermissions('microphone');

	const { isEnabled, isRegistered, isInCall } = useVoipState();
	const { makeCall } = useVoipAPI();

	const members = useMemo(() => uids.filter((uid) => uid !== ownUserId), [uids, ownUserId]);
	const remoteUserId = members[0];

	const { data: { user: remoteUser } = {}, isPending } = useUserInfoQuery({ userId: remoteUserId }, { enabled: Boolean(remoteUserId) });

	const isRemoteRegistered = !!remoteUser?.freeSwitchExtension;
	const isDM = members.length === 1;

	const disabled = isMicPermissionDenied || !isDM || isInCall || isPending;
	const allowed = canStartVoiceCall && isDM && !isInCall && !isPending;
	const canMakeVoipCall = allowed && isRemoteRegistered && isRegistered && isEnabled && !isMicPermissionDenied;

	const tooltip = useMemo(() => {
		if (isMicPermissionDenied) {
			return t('Microphone_access_not_allowed');
		}

		if (isInCall) {
			return t('Unable_to_make_calls_while_another_is_ongoing');
		}

		return disabled ? t('Voice_calling_disabled') : '';
	}, [disabled, isInCall, isMicPermissionDenied, t]);

	const handleOnClick = useEffectEvent(() => {
		if (canMakeVoipCall) {
			return makeCall(remoteUser?.freeSwitchExtension as string);
		}
		dispatchWarning();
	});

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!allowed) {
			return undefined;
		}

		return {
			id: 'start-voice-call',
			title: 'Voice_Call',
			icon: 'phone',
			featured: true,
			action: handleOnClick,
			groups: ['direct'] as const,
			disabled,
			tooltip,
		};
	}, [allowed, disabled, handleOnClick, tooltip]);
};
