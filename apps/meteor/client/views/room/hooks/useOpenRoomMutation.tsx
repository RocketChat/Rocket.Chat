import type { RoomType } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { updateSubscription } from '../../../lib/mutationEffects/updateSubscription';

const openEndpoints = {
	p: '/v1/groups.open',
	d: '/v1/im.open',
	c: '/v1/channels.open',
	v: '/v1/channels.open',
	l: '/v1/channels.open',
} as const;

type OpenRoomParams = {
	roomId: string;
	userId: string;
};

export const useOpenRoomMutation = ({ type }: { type: RoomType }) => {
	const openRoom = useEndpoint('POST', openEndpoints[type]);

	return useMutation({
		mutationFn: async ({ roomId, userId }: OpenRoomParams) => {
			await openRoom({ roomId });

			return { userId, roomId };
		},
		onMutate: async ({ roomId, userId }) => {
			return updateSubscription(roomId, userId, { open: true });
		},
		onError: async (_, { roomId, userId }, rollbackDocument) => {
			if (!rollbackDocument) {
				return;
			}

			const { open } = rollbackDocument;
			await updateSubscription(roomId, userId, { open });
		},
	});
};
