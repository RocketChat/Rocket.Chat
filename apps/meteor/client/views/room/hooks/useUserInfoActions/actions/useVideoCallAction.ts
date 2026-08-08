import type { IUser } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import {
	useTranslation,
	useUserRoom,
	useUserId,
	useUserSubscriptionByName,
	useSetting,
	usePermission,
	useUserCard,
	useEndpoint,
} from '@rocket.chat/ui-contexts';
import {
	useVideoConfDispatchOutgoing,
	useVideoConfIsCalling,
	useVideoConfIsRinging,
	useVideoConfLoadCapabilities,
} from '@rocket.chat/ui-video-conf';
import { useMemo } from 'react';

import { useVideoConfWarning } from '../../../contextualBar/VideoConference/hooks/useVideoConfWarning';
import type { UserInfoAction } from '../useUserInfoActions';

export const useVideoCallAction = (user: Pick<IUser, '_id' | 'username'>): UserInfoAction | undefined => {
	const t = useTranslation();
	const usernameSubscription = useUserSubscriptionByName(user.username ?? '');
	const room = useUserRoom(usernameSubscription?.rid || '');
	const { closeUserCard } = useUserCard();

	const loadCapabilities = useVideoConfLoadCapabilities();
	const dispatchWarning = useVideoConfWarning();
	const dispatchPopup = useVideoConfDispatchOutgoing();
	const isCalling = useVideoConfIsCalling();
	const isRinging = useVideoConfIsRinging();
	const ownUserId = useUserId();

	const enabledForDMs = useSetting('VideoConf_Enable_DMs');
	const permittedToCallManagement = usePermission('call-management', room?._id);
	const canCreateDirectMessage = usePermission('create-d');
	const createDirectMessage = useEndpoint('POST', '/v1/im.create');

	const videoCallOption = useMemo<UserInfoAction | undefined>(() => {
		const action = async (): Promise<void> => {
			if (isCalling || isRinging || !user.username) {
				return;
			}

			try {
				const rid = room?._id ?? (await createDirectMessage({ username: user.username })).room.rid;
				await loadCapabilities();
				closeUserCard();
				dispatchPopup({ rid });
			} catch (error: any) {
				dispatchWarning(error.error);
			}
		};

		const shouldShowStartCall =
			(room ? !isRoomFederated(room) : canCreateDirectMessage) &&
			user._id !== ownUserId &&
			enabledForDMs &&
			permittedToCallManagement &&
			!isCalling &&
			!isRinging;

		return shouldShowStartCall
			? {
					type: 'communication',
					title: t('Video_call'),
					icon: 'video',
					onClick: action,
				}
			: undefined;
	}, [
		room,
		user._id,
		user.username,
		canCreateDirectMessage,
		createDirectMessage,
		ownUserId,
		enabledForDMs,
		permittedToCallManagement,
		isCalling,
		isRinging,
		t,
		dispatchPopup,
		dispatchWarning,
		closeUserCard,
		loadCapabilities,
	]);

	return videoCallOption;
};
