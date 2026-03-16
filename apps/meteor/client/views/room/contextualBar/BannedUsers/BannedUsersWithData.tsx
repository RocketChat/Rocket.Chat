import { useRoomToolbox, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import BannedUsers from './BannedUsers';
import { useEndpointMutation } from '../../../../hooks/useEndpointMutation';
import { roomsQueryKeys } from '../../../../lib/queryKeys';
import { useRoomBannedUsers } from '../../../hooks/useRoomBannedUsers';
import { useRoom } from '../../contexts/RoomContext';

const BannedUsersWithData = () => {
	const room = useRoom();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();
	const { closeTab } = useRoomToolbox();

	const { data, isPending, error, hasNextPage, fetchNextPage } = useRoomBannedUsers({ rid: room._id });

	const { mutate: unbanUser } = useEndpointMutation('POST', '/v1/rooms.unbanUser', {
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: roomsQueryKeys.bannedUsers(room._id) });
			void queryClient.invalidateQueries({ queryKey: roomsQueryKeys.members(room._id, room.t) });
		},
		onError: (mutationError) => {
			dispatchToastMessage({ type: 'error', message: mutationError });
		},
	});

	const handleUnban = useCallback(
		(userId: string) => {
			unbanUser({ roomId: room._id, userId });
		},
		[room._id, unbanUser],
	);

	return (
		<BannedUsers
			loading={isPending}
			error={error ?? undefined}
			bannedUsers={data?.bannedUsers ?? []}
			onClickClose={closeTab}
			onClickUnban={handleUnban}
			onLoadMore={hasNextPage ? () => void fetchNextPage() : () => undefined}
		/>
	);
};

export default BannedUsersWithData;
