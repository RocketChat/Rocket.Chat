import type { RoomType } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { updateSubscription } from '../lib/mutationEffects/updateSubscription';

type UnhideRoomProps = {
	rid: string;
	type: RoomType;
};

const OPEN_ENDPOINTS_BY_ROOM_TYPE = {
	p: '/v1/groups.open', // private
	c: '/v1/channels.open', // channel
	d: '/v1/im.open', // direct message
	l: '/v1/channels.open', // livechat
} as const;

export const useUnhideRoomAction = ({ rid: roomId, type }: UnhideRoomProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const userId = useUserId();

	const openRoomEndpoint = useEndpoint('POST', OPEN_ENDPOINTS_BY_ROOM_TYPE[type]);

	const unhideRoom = useMutation({
		mutationFn: () => openRoomEndpoint({ roomId }),
		onMutate: async () => {
			if (userId) {
				return updateSubscription(roomId, userId, { open: true });
			}
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Room_unhidden_successfully') });
		},
		onError: async (error, _, rollbackDocument) => {
			dispatchToastMessage({ type: 'error', message: error });

			if (userId && rollbackDocument) {
				const { open } = rollbackDocument;
				updateSubscription(roomId, userId, { open });
			}
		},
	});

	const handleUnhide = useEffectEvent(() => {
		unhideRoom.mutate();
	});

	return handleUnhide;
};
