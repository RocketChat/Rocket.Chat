import type { IUser } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useVoipAPI, useVoipState } from '@rocket.chat/ui-voip';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaPermissions } from '../../../composer/messageBox/hooks/useMediaPermissions';
import { useUserCard } from '../../../contexts/UserCardContext';
import type { UserInfoAction } from '../useUserInfoActions';

export const useVoipCallAction = (user: Pick<IUser, '_id' | 'username' | 'freeSwitchExtension'>): UserInfoAction | undefined => {
	const { t } = useTranslation();
	const { closeUserCard } = useUserCard();
	const ownUserId = useUserId();

	const { isEnabled, isRegistered, isInCall } = useVoipState();
	const { makeCall } = useVoipAPI();
	const [isMicPermissionDenied] = useMediaPermissions('microphone');

	const isRemoteRegistered = !!user?.freeSwitchExtension;
	const isSameUser = ownUserId === user._id;

	const disabled = isSameUser || isMicPermissionDenied || !isRemoteRegistered || !isRegistered || isInCall;

	const voipCallOption = useMemo<UserInfoAction | undefined>(() => {
		const handleClick = () => {
			makeCall(user?.freeSwitchExtension as string);
			closeUserCard();
		};

		return isEnabled && !isSameUser
			? {
					type: 'communication',
					title: t('Voice_call'),
					icon: 'phone',
					disabled,
					onClick: handleClick,
			  }
			: undefined;
	}, [closeUserCard, disabled, isEnabled, isSameUser, makeCall, t, user?.freeSwitchExtension]);

	return voipCallOption;
};
