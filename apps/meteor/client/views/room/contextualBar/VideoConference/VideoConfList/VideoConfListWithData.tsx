import { useRoomToolbox } from '@rocket.chat/ui-contexts';

import VideoConfList from './VideoConfList';
import { useVideoConfList } from './useVideoConfList';
import { useRoom } from '../../../contexts/RoomContext';

const VideoConfListWithData = () => {
	const room = useRoom();
	const { closeTab } = useRoomToolbox();
	const { isPending, data, error, refetch, fetchNextPage } = useVideoConfList({ roomId: room._id });

	return (
		<VideoConfList
			loading={isPending}
			videoConfs={data?.videoConfs ?? []}
			total={data?.total ?? 0}
			error={error ?? undefined}
			reload={refetch}
			loadMoreItems={fetchNextPage}
			onClose={closeTab}
		/>
	);
};

export default VideoConfListWithData;
