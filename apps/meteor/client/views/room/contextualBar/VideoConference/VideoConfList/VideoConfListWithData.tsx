import { useMemo } from 'react';

import VideoConfList from './VideoConfList';
import { useVideoConfList } from './useVideoConfList';
import { useRecordList } from '../../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useRoom } from '../../../contexts/RoomContext';
import { useRoomToolbox } from '../../../contexts/RoomToolboxContext';

const VideoConfListWithData = () => {
	const room = useRoom();
	const { closeTab } = useRoomToolbox();
	const options = useMemo(() => ({ roomId: room._id }), [room._id]);
	const { reload, videoConfList, loadMoreItems } = useVideoConfList(options);
	const { phase, error, items: videoConfs, itemCount: totalItemCount } = useRecordList(videoConfList);

	return (
		<VideoConfList
			onClose={closeTab}
			loadMoreItems={loadMoreItems}
			loading={phase === AsyncStatePhase.LOADING}
			total={totalItemCount}
			error={error}
			reload={reload}
			videoConfs={videoConfs}
		/>
	);
};

export default VideoConfListWithData;
