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
	useVideoConfIsCalling,
	useVideoConfIsRinging,
	useVideoConfLoadCapabilities,
	useVideoConfStartCall,
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
	const startCall = useVideoConfStartCall();
	const isCalling = useVideoConfIsCalling();
	const isRinging = useVideoConfIsRinging();
	const ownUserId = useUserId();

	const enabledForDMs = useSetting('VideoConf_Enable_DMs');
	const permittedToCallManagement = usePermission('call-management', room?._id);

	const createDirectMessage = useEndpoint('POST', '/v1/im.create');

	const videoCallOption = useMemo<UserInfoAction | undefined>(() => {
		const action = async (): Promise<void> => {
			if (isCalling || isRinging) {
				return;
			}

			try {
				await loadCapabilities();
				closeUserCard();

				let rid = room?._id;
				if (!rid) {
					const { room: newRoom } = await createDirectMessage({ usernames: user.username ?? '' });
					rid = newRoom._id;
				}

				startCall(rid);
			} catch (error: any) {
				dispatchWarning(error.error);
			}
		};

		const shouldShowStartCall =
			(!room || !isRoomFederated(room)) && user._id !== ownUserId && enabledForDMs && permittedToCallManagement && !isCalling && !isRinging;

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
		ownUserId,
		enabledForDMs,
		permittedToCallManagement,
		isCalling,
		isRinging,
		t,
		startCall,
		dispatchWarning,
		closeUserCard,
		loadCapabilities,
		createDirectMessage,
	]);

	return videoCallOption;
};
