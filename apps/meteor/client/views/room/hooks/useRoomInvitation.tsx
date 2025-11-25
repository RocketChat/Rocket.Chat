import type { IRoom } from '@rocket.chat/core-typings';
import { useUser } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';

import { useEndpointMutation } from '../../../hooks/useEndpointMutation';

export const useRoomInvitation = (room: IRoom) => {
	const queryClient = useQueryClient();
	const user = useUser();

	const replyInvite = useEndpointMutation('POST', '/v1/rooms.invite', {
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['rooms', room.fname] });
			await queryClient.invalidateQueries({
				queryKey: ['rooms', { reference: room.fname, type: room.t }, { uid: user?._id, username: user?.username }],
			});
		},
	});

	return {
		...replyInvite,
		acceptInvite: () => replyInvite.mutate({ roomId: room._id, action: 'accept' }),
		rejectInvite: () => replyInvite.mutate({ roomId: room._id, action: 'reject' }),
	};
};
