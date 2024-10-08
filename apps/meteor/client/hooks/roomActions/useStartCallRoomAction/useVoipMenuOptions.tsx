import { Box } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useVoipAPI, useVoipState } from '@rocket.chat/ui-voip';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaPermissions } from '../../../views/room/composer/messageBox/hooks/useMediaPermissions';
import { useRoom } from '../../../views/room/contexts/RoomContext';
import { useUserInfoQuery } from '../../useUserInfoQuery';

const useVoipMenuOptions = () => {
	const { t } = useTranslation();
	const { uids = [] } = useRoom();
	const ownUserId = useUserId();

	const [isMicPermissionDenied] = useMediaPermissions('microphone');

	const { isEnabled, isRegistered, isInCall } = useVoipState();
	const { makeCall } = useVoipAPI();

	const members = useMemo(() => uids.filter((uid) => uid !== ownUserId), [uids, ownUserId]);
	const remoteUserId = members[0];

	const { data: { user: remoteUser } = {}, isLoading } = useUserInfoQuery({ userId: remoteUserId }, { enabled: Boolean(remoteUserId) });

	const isRemoteRegistered = !!remoteUser?.freeSwitchExtension;
	const isDM = members.length === 1;

	const disabled = isMicPermissionDenied || !isDM || !isRemoteRegistered || !isRegistered || isInCall || isLoading;

	const title = useMemo(() => {
		if (isMicPermissionDenied) {
			return t('Microphone_access_not_allowed');
		}

		if (isInCall) {
			return t('Unable_to_make_calls_while_another_is_ongoing');
		}

		return disabled ? t('Voice_calling_disabled') : '';
	}, [disabled, isInCall, isMicPermissionDenied, t]);

	return useMemo(() => {
		const items: GenericMenuItemProps[] = [
			{
				id: 'start-voip-call',
				icon: 'phone',
				disabled,
				onClick: () => makeCall(remoteUser?.freeSwitchExtension as string),
				content: (
					<Box is='span' title={title}>
						{t('Voice_call')}
					</Box>
				),
			},
		];

		return {
			items: isEnabled ? items : [],
			groups: ['direct'] as const,
			disabled,
			allowed: isEnabled,
			order: 4,
		};
	}, [disabled, title, t, isEnabled, makeCall, remoteUser?.freeSwitchExtension]);
};

export default useVoipMenuOptions;
