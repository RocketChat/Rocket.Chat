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
	useVideoConfStartCall,
	useVideoConfWindowEnabled,
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
	const startCall = useVideoConfStartCall();
	const isCalling = useVideoConfIsCalling();
	const isRinging = useVideoConfIsRinging();
	const ownUserId = useUserId();
	const conferenceWindowEnabled = useVideoConfWindowEnabled();

	const enabledForDMs = useSetting('VideoConf_Enable_DMs');
	const permittedToCallManagement = usePermission('call-management', room?._id);

	const createDirectMessage = useEndpoint('POST', '/v1/im.create');

	const videoCallOption = useMemo<UserInfoAction | undefined>(() => {
		const action = async (): Promise<void> => {
			// Without the call window, calling from a user card is calling *in a room*, and the popup that asks
			// about mic and camera needs one to name the call after — so there is nothing to do without it.
			if (isCalling || isRinging || (!conferenceWindowEnabled && !room)) {
				return;
			}

			try {
				await loadCapabilities();
				closeUserCard();

				// A call placed from a card is about the person, not the room, so a missing DM is created on the way
				// (im.create also returns the existing room when the subscription simply hasn't resolved yet).
				const rid = room?._id ?? (await createDirectMessage({ username: user.username })).room.rid;

				if (conferenceWindowEnabled) {
					startCall(rid);
					return;
				}

				dispatchPopup({ rid });
			} catch (error: any) {
				dispatchWarning(error.error);
			}
		};

		// Without a DM, the entry is only offered to someone a DM can be created with: im.create needs a username,
		// and calls are not supported over federation.
		const hasCallableRoom = room ? !isRoomFederated(room) : canCreateDirectMessage && !user.federated && !!user.username;

		const shouldShowStartCall =
			hasCallableRoom && user._id !== ownUserId && enabledForDMs && permittedToCallManagement && !isCalling && !isRinging;

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
		user.federated,
		canCreateDirectMessage,
		ownUserId,
		enabledForDMs,
		permittedToCallManagement,
		isCalling,
		isRinging,
		conferenceWindowEnabled,
		t,
		startCall,
		dispatchPopup,
		dispatchWarning,
		closeUserCard,
		loadCapabilities,
		createDirectMessage,
	]);

	return videoCallOption;
};
