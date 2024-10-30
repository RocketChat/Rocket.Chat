import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { ChatSubscription } from '../../../../app/models/client';

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
		onSuccess: (roomId: string) => {
			ChatSubscription.update({ roomId, 'u._id': Meteor.userId() }, { $set: { open: true } });
		},
	});
};
