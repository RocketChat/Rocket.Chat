import { useRoomToolbox } from '@rocket.chat/ui-contexts';

import BannedUsers from './BannedUsers';
import { useUnbanUser } from './hooks/useUnbanUser';
import { useRoomBannedUsers } from '../../../hooks/useRoomBannedUsers';
import { useRoom } from '../../contexts/RoomContext';

const BannedUsersWithData = () => {
	const { closeTab } = useRoomToolbox();
	const room = useRoom();

	const { data, error, isPending, hasNextPage, fetchNextPage } = useRoomBannedUsers({ rid: room._id });

	const handleUnban = useUnbanUser({ roomId: room._id });

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
