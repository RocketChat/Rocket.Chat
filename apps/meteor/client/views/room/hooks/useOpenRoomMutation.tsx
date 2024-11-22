import type { RoomType } from '@rocket.chat/core-typings';
import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { updateSubscription } from '../../../lib/mutationEffects/updateSubscription';

const openEndpoints = {
	p: '/v1/groups.open',
	d: '/v1/im.open',
	c: '/v1/channels.open',
	v: '/v1/channels.open',
	l: '/v1/channels.open',
} as const;

export const useOpenRoomMutation = ({ type }: { type: RoomType }) => {
	const openRoom = useEndpoint('POST', openEndpoints[type]);
	const userId = useUserId();

	return useMutation({
		mutationFn: async ({ roomId }: { roomId: string }) => {
			if (!userId) {
				throw new Error('error-invalid-user');
			}

			await openRoom({ roomId });

			return { userId, roomId };
		},
		onMutate: async ({ roomId }) => {
			if (!userId) {
				return;
			}

			return updateSubscription(roomId, userId, { open: true });
		},
		onError: async (_, { roomId }, rollbackDocument) => {
			if (!userId || !rollbackDocument) {
				return;
			}

			const { open } = rollbackDocument;
			await updateSubscription(roomId, userId, { open });
		},
	});
};
