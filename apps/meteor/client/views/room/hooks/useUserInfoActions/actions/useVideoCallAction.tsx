import type { IUser } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useTranslation, useUserRoom, useUserId, useUserSubscriptionByName, useSetting, usePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useVideoConfDispatchOutgoing, useVideoConfIsCalling, useVideoConfIsRinging } from '../../../../../contexts/VideoConfContext';
import { VideoConfManager } from '../../../../../lib/VideoConfManager';
import { useUserCard } from '../../../contexts/UserCardContext';
import { useVideoConfWarning } from '../../../contextualBar/VideoConference/hooks/useVideoConfWarning';
import type { UserInfoAction } from '../useUserInfoActions';

export const useVideoCallAction = (user: Pick<IUser, '_id' | 'username'>): UserInfoAction | undefined => {
	const t = useTranslation();
	const usernameSubscription = useUserSubscriptionByName(user.username ?? '');
	const room = useUserRoom(usernameSubscription?.rid || '');
	const { closeUserCard } = useUserCard();

	const dispatchWarning = useVideoConfWarning();
	const dispatchPopup = useVideoConfDispatchOutgoing();
	const isCalling = useVideoConfIsCalling();
	const isRinging = useVideoConfIsRinging();
	const ownUserId = useUserId();

	const enabledForDMs = useSetting('VideoConf_Enable_DMs');
	const permittedToCallManagement = usePermission('call-management', room?._id);

	const videoCallOption = useMemo<UserInfoAction | undefined>(() => {
		const action = async (): Promise<void> => {
			if (isCalling || isRinging || !room) {
				return;
			}

			try {
				await VideoConfManager.loadCapabilities();
				closeUserCard();
				dispatchPopup({ rid: room._id });
			} catch (error: any) {
				dispatchWarning(error.error);
			}
		};

		const shouldShowStartCall =
			room && !isRoomFederated(room) && user._id !== ownUserId && enabledForDMs && permittedToCallManagement && !isCalling && !isRinging;

		return shouldShowStartCall
			? {
					type: 'communication',
					content: t('Video_call'),
					icon: 'video',
					iconOnly: true,
					onClick: action,
			  }
			: undefined;
	}, [
		room,
		user._id,
		ownUserId,
		enabledForDMs,
		permittedToCallManagement,
		isCalling,
		isRinging,
		t,
		dispatchPopup,
		dispatchWarning,
		closeUserCard,
	]);

	return videoCallOption;
};
