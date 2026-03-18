import { useRoomToolbox, useSetting } from '@rocket.chat/ui-contexts';

import BannedUsers from './BannedUsers';
import { useRoomBannedUsers } from '../../../hooks/useRoomBannedUsers';
import { useRoom } from '../../contexts/RoomContext';
import { useUnbanUser } from '../../hooks/useUnbanUser';

const BannedUsersWithData = () => {
	const room = useRoom();
	const { closeTab } = useRoomToolbox();
	const useRealName = useSetting('UI_Use_Real_Name', false);

	const { data, error, isPending, hasNextPage, fetchNextPage } = useRoomBannedUsers({ rid: room._id });

	const handleUnban = useUnbanUser({ roomId: room._id });

	return (
		<BannedUsers
			loading={isPending}
			error={error ?? undefined}
			useRealName={useRealName}
			bannedUsers={data?.bannedUsers ?? []}
			onClickClose={closeTab}
			onClickUnban={handleUnban}
			onLoadMore={hasNextPage ? () => void fetchNextPage() : () => undefined}
		/>
	);
};

export default BannedUsersWithData;
