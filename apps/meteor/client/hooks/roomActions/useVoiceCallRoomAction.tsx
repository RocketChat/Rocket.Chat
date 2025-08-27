import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useMediaDeviceMicrophonePermission, usePermission, useUserId } from '@rocket.chat/ui-contexts';
import { useVoipAPI, useVoipState, useDevicePermissionPrompt } from '@rocket.chat/ui-voip';
import { useMemo } from 'react';

import { useRoom } from '../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';
import { useUserInfoQuery } from '../useUserInfoQuery';
import { useVoipWarningModal } from '../useVoipWarningModal';

export const useVoiceCallRoomAction = () => {
	const { uids = [] } = useRoom();
	const ownUserId = useUserId();
	const canStartVoiceCall = usePermission('view-user-voip-extension');
	const dispatchWarning = useVoipWarningModal();

	const { state: micPermissionState } = useMediaDeviceMicrophonePermission();

	const isMicPermissionDenied = micPermissionState === 'denied';

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
			return 'Microphone_access_not_allowed';
		}

		if (isInCall) {
			return 'Unable_to_make_calls_while_another_is_ongoing';
		}

		return disabled ? 'Voice_calling_disabled' : '';
	}, [disabled, isInCall, isMicPermissionDenied]);

	const promptPermission = useDevicePermissionPrompt({
		actionType: 'outgoing',
		onAccept: () => {
			makeCall(remoteUser?.freeSwitchExtension as string);
		},
	});

	const handleOnClick = useEffectEvent(() => {
		if (canMakeVoipCall) {
			return promptPermission();
		}
		dispatchWarning();
	});

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!allowed) {
			return undefined;
		}

		return {
			id: 'start-voice-call',
			title: tooltip || 'Voice_Call',
			icon: 'phone',
			featured: true,
			action: handleOnClick,
			groups: ['direct'] as const,
			order: 2,
			disabled,
		};
	}, [allowed, disabled, handleOnClick, tooltip]);
};
