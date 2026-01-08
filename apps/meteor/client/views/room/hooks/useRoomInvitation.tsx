import { useRoomRejectInvitationModal } from './useRoomRejectInvitationModal';
import { useEndpointMutation } from '../../../hooks/useEndpointMutation';
import type { IRoomWithFederationOriginalName } from '../contexts/RoomContext';

export const useRoomInvitation = (room: IRoomWithFederationOriginalName) => {
	const { open: openConfirmationModal } = useRoomRejectInvitationModal(room);
	const replyInvite = useEndpointMutation('POST', '/v1/rooms.invite');

	return {
		...replyInvite,
		acceptInvite: async () => replyInvite.mutate({ roomId: room._id, action: 'accept' }),
		rejectInvite: async () => {
			if (await openConfirmationModal()) replyInvite.mutate({ roomId: room._id, action: 'reject' });
		},
	};
};
