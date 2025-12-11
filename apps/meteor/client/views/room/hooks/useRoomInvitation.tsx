import { useRouter, useUser } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';

import { useRoomRejectInvitationModal } from './useRoomRejectInvitationModal';
import { useEndpointMutation } from '../../../hooks/useEndpointMutation';
import { roomsQueryKeys } from '../../../lib/queryKeys';
import type { IRoomWithFederationOriginalName } from '../contexts/RoomContext';

export const useRoomInvitation = (room: IRoomWithFederationOriginalName) => {
	const queryClient = useQueryClient();
	const user = useUser();
	const router = useRouter();

	const { open: openConfirmationModal } = useRoomRejectInvitationModal(room);

	const replyInvite = useEndpointMutation('POST', '/v1/rooms.invite', {
		onSuccess: async (_, { action }) => {
			const reference = room.federationOriginalName ?? room.name;

			if (reference) {
				await queryClient.refetchQueries({
					queryKey: roomsQueryKeys.roomReference(reference, room.t, user?._id, user?.username),
				});
			}

			await queryClient.invalidateQueries({ queryKey: roomsQueryKeys.room(room._id) });

			if (action === 'reject') {
				router.navigate('/home');
			}
		},
	});

	return {
		...replyInvite,
		acceptInvite: async () => replyInvite.mutate({ roomId: room._id, action: 'accept' }),
		rejectInvite: async () => {
			if (await openConfirmationModal()) replyInvite.mutate({ roomId: room._id, action: 'reject' });
		},
	};
};
