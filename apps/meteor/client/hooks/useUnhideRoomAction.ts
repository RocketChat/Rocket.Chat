import type { RoomType } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { updateSubscription } from '../lib/mutationEffects/updateSubscription';

type UnhideRoomProps = {
	rid: string;
	type: RoomType;
};

const OPEN_ENDPOINTS_BY_ROOM_TYPE = {
	p: '/v1/groups.open',
	c: '/v1/channels.open',
	d: '/v1/im.open',
	l: '/v1/channels.open',
} as const;

export const useUnhideRoomAction = ({ rid: roomId, type }: UnhideRoomProps) => {
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
		onError: async (error, _, rollbackDocument) => {
			dispatchToastMessage({ type: 'error', message: error });

			if (userId && rollbackDocument) {
				const { open } = rollbackDocument;
				updateSubscription(roomId, userId, { open });
			}
		},
	});

	return useStableCallback(() => unhideRoom.mutate());
};
