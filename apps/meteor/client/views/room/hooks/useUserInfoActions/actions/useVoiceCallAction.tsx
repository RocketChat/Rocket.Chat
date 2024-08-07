import type { IUser } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import useVoiceCallAPI from '../../../../../hooks/voiceCall/useVoiceCallAPI';
import useVoiceCallState from '../../../../../hooks/voiceCall/useVoiceCallState';
import { useMediaPermissions } from '../../../composer/messageBox/hooks/useMediaPermissions';
import { useUserCard } from '../../../contexts/UserCardContext';
import type { UserInfoAction } from '../useUserInfoActions';

export const useVoiceCallAction = (user: Pick<IUser, '_id' | 'username' | 'freeSwitchExtension'>): UserInfoAction | undefined => {
	const { t } = useTranslation();
	const { closeUserCard } = useUserCard();
	const ownUserId = useUserId();

	const { isEnabled, isRegistered, isInCall } = useVoiceCallState();
	const { makeCall } = useVoiceCallAPI();
	const [isMicPermissionDenied] = useMediaPermissions('microphone');

	const isRemoteRegistered = !!user?.freeSwitchExtension;
	const isSameUser = ownUserId === user._id;

	const disabled = isSameUser || isMicPermissionDenied || !isRemoteRegistered || !isRegistered || isInCall;

	console.log(user);
	console.log(isSameUser, isMicPermissionDenied, isRemoteRegistered, isRegistered, isInCall);

	const voiceCallOption = useMemo<UserInfoAction | undefined>(() => {
		const handleClick = () => {
			makeCall(user?.freeSwitchExtension as string);
			closeUserCard();
		};

		return isEnabled && !isSameUser
			? {
					type: 'communication',
					content: t('Voice_call'),
					icon: 'phone',
					disabled,
					iconOnly: true,
					onClick: handleClick,
			  }
			: undefined;
	}, [closeUserCard, disabled, isEnabled, isSameUser, makeCall, t, user?.freeSwitchExtension]);

	return voiceCallOption;
};
