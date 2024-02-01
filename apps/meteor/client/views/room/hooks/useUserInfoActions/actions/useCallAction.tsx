import type { IUser } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useTranslation, useUserRoom, useUserId, useUserSubscriptionByName, useSetting, usePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { closeUserCard } from '../../../../../../app/ui/client/lib/userCard';
import { useVideoConfDispatchOutgoing, useVideoConfIsCalling, useVideoConfIsRinging } from '../../../../../contexts/VideoConfContext';
import { VideoConfManager } from '../../../../../lib/VideoConfManager';
import { useVideoConfWarning } from '../../../contextualBar/VideoConference/hooks/useVideoConfWarning';
import type { UserInfoAction, UserInfoActionType } from '../useUserInfoActions';

export const useCallAction = (user: Pick<IUser, '_id' | 'username'>): UserInfoAction | undefined => {
	const t = useTranslation();
	const usernameSubscription = useUserSubscriptionByName(user.username ?? '');
	const room = useUserRoom(usernameSubscription?.rid || '');

	const dispatchWarning = useVideoConfWarning();
	const dispatchPopup = useVideoConfDispatchOutgoing();
	const isCalling = useVideoConfIsCalling();
	const isRinging = useVideoConfIsRinging();
	const ownUserId = useUserId();

	const enabledForDMs = useSetting('VideoConf_Enable_DMs');
	const permittedToCallManagement = usePermission('call-management', room?._id);

	const videoCallOption = useMemo(() => {
		const action = async (): Promise<void> => {
			if (isCalling || isRinging || !room || !enabledForDMs) {
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
					content: t('Start_call'),
					icon: 'phone' as const,
					onClick: action,
					type: 'communication' as UserInfoActionType,
			  }
			: undefined;
	}, [room, user._id, ownUserId, enabledForDMs, permittedToCallManagement, isCalling, isRinging, t, dispatchPopup, dispatchWarning]);

	return videoCallOption;
};
