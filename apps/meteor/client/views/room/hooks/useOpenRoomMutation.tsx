import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { updateSubscription } from '../../../lib/mutationEffects/updateSubscription';

type OpenRoomParams = {
	roomId: string;
	userId: string;
};

export const useOpenRoomMutation = () => {
	const openRoom = useEndpoint('POST', '/v1/rooms.open');

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
