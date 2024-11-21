import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { Subscriptions } from '../../../../app/models/client';

export const useOpenRoomMutation = () => {
	const openRoom = useEndpoint('POST', '/v1/rooms.open');
	const userId = useUserId();

	return useMutation({
		mutationFn: async ({ roomId }: { roomId: string }) => {
			if (!userId) {
				throw new Error('error-invalid-user');
			}

			await openRoom({ roomId });

			return roomId;
		},
		onMutate: async ({ roomId: rid }) => {
			const ogDocument = await Subscriptions.findOne({ rid, 'u._id': userId }, { fields: { open: 1 } });
			await Subscriptions.update({ rid, 'u._id': userId }, { $set: { open: true } });
			return { ogDocument };
		},
		onError: async (_, { roomId }, context) => {
			if (!context?.ogDocument) {
				return;
			}

			const { open } = context.ogDocument;
			Subscriptions.update({ roomId, 'u._id': userId }, { $set: { open } });
		},
	});
};
