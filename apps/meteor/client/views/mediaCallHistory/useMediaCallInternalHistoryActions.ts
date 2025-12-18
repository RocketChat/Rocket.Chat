import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { LocationPathname } from '@rocket.chat/ui-contexts';
import { useCurrentRoutePath, useRoomToolbox, useRouter, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { useMediaCallContext } from '@rocket.chat/ui-voip';
import { useMemo } from 'react';

import { useRoom } from '../room/contexts/RoomContext';
import { useDirectMessageAction } from '../room/hooks/useUserInfoActions/actions/useDirectMessageAction';

export type InternalCallHistoryContact = {
	_id: string;
	name?: string;
	username: string;
	displayName?: string;
	voiceCallExtension?: string;
	avatarUrl?: string;
};

export const useMediaCallInternalHistoryActions = (contact: InternalCallHistoryContact, messageId?: string) => {
	const { onToggleWidget } = useMediaCallContext();
	const router = useRouter();

	const currentRoutePath = useCurrentRoutePath();
	const room = useRoom();
	const toolbox = useRoomToolbox();
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

	const directMessage = useDirectMessageAction(contact, room._id);

	const jumpToMessage = useEffectEvent(() => {
		if (!messageId || !currentRoutePath) {
			return;
		}

		const { msg: _, ...searchParams } = router.getSearchParameters();

		router.navigate(
			{
				pathname: currentRoutePath as LocationPathname,
				search: messageId ? { ...searchParams, msg: messageId } : searchParams,
			},
			{ replace: true },
		);
	});

	const userInfo = useEffectEvent(() => {
		toolbox.openTab('user-info', contact._id);
	});

	return useMemo(
		() => ({
			voiceCall,
			directMessage: directMessage && 'onClick' in directMessage ? directMessage.onClick : undefined,
			jumpToMessage,
			userInfo,
		}),
		[voiceCall, directMessage, jumpToMessage, userInfo],
	);
};
