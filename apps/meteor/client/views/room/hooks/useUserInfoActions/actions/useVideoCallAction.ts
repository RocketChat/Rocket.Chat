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
} from '@rocket.chat/ui-video-conf';
import { useMemo } from 'react';

import { useConferenceWindowEnabled } from '../../../../conference/hooks/useConferenceWindowEnabled';
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
	const conferenceWindowEnabled = useConferenceWindowEnabled();

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

				// The popup, as before. `room` is always present here — the guard above returned otherwise — and is
				// re-tested only so its type says so.
				if (!conferenceWindowEnabled) {
					if (room) {
						dispatchPopup({ rid: room._id });
					}
					return;
				}

				// The call window asks for itself, and a call placed from a card is about the person, not the room —
				// so a direct room is created for one that doesn't exist yet, rather than hiding the entry.
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

		// The entry appears where it always did — in a room, and never a federated one. With the call window it
		// also appears with no room at all, since one can be created on the way to the call — but only for someone
		// a room can be created *with*: `im.create` speaks usernames, and offering the call to a user without one
		// would end in a warning toast instead of a call.
		const hasCallableRoom = room ? !isRoomFederated(room) : conferenceWindowEnabled && !!user.username;

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
