import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { useMediaCallContext } from '@rocket.chat/ui-voip';
import { useMemo } from 'react';

import { useDirectMessageAction } from '../room/hooks/useUserInfoActions/actions/useDirectMessageAction';

export type InternalCallHistoryContact = {
	_id: string;
	name?: string;
	username: string;
	displayName?: string;
	voiceCallExtension?: string;
	avatarUrl?: string;
};

type UseMediaCallInternalHistoryActionsBaseOptions = {
	contact: InternalCallHistoryContact;
	messageId?: string;
	openRoomId?: string;
	messageRoomId?: string;
	openUserInfo?: (userId: string) => void;
};

export const useMediaCallInternalHistoryActions = ({
	contact,
	messageId,
	openRoomId,
	messageRoomId,
	openUserInfo,
}: UseMediaCallInternalHistoryActionsBaseOptions) => {
	const { onToggleWidget } = useMediaCallContext();
	const router = useRouter();

	const getAvatarUrl = useUserAvatarPath();

	const voiceCall = useEffectEvent(() => {
		if (!onToggleWidget) {
			return;
		}

		onToggleWidget({
			userId: contact._id,
			displayName: contact.displayName ?? '',
			username: contact.username,
			avatarUrl: getAvatarUrl({ username: contact.username }),
			callerId: contact.voiceCallExtension,
		});
	});

	const directMessage = useDirectMessageAction(contact, openRoomId ?? '');

	const goToDirectMessage = useMemo(() => {
		if (directMessage?.onClick) {
			return directMessage.onClick;
		}
		if (!messageRoomId || openRoomId) {
			return;
		}
		return () =>
			router.navigate({
				name: 'direct',
				params: { rid: messageRoomId },
			});
	}, [directMessage?.onClick, messageRoomId, openRoomId, router]);

	const jumpToMessage = useEffectEvent(() => {
		const rid = messageRoomId || openRoomId;
		if (!messageId || !rid) {
			return;
		}

		const { msg: _, ...searchParams } = router.getSearchParameters();

		router.navigate({
			name: 'direct',
			params: { rid },
			search: { ...searchParams, msg: messageId },
		});
	});

	const userInfo = useEffectEvent(() => {
		if (!openUserInfo) {
			return;
		}
		openUserInfo(contact._id);
	});

	return useMemo(
		() => ({
			voiceCall,
			directMessage: goToDirectMessage,
			jumpToMessage: messageId && messageRoomId ? jumpToMessage : undefined,
			userInfo: openUserInfo ? () => userInfo() : undefined,
		}),
		[voiceCall, goToDirectMessage, messageId, messageRoomId, jumpToMessage, openUserInfo, userInfo],
	);
};
