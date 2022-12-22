import type { IRoom } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import { useRecordList } from '../../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useTabBarClose } from '../../../contexts/ToolboxContext';
import VideoConfList from './VideoConfList';
import { useVideoConfList } from './useVideoConfList';

const VideoConfListWithData = ({ rid }: { rid: IRoom['_id'] }): ReactElement => {
	const onClose = useTabBarClose();
	const options = useMemo(() => ({ roomId: rid }), [rid]);
	const { reload, videoConfList, loadMoreItems } = useVideoConfList(options);
	const { phase, error, items: videoConfs, itemCount: totalItemCount } = useRecordList(videoConfList);

	return (
		<VideoConfList
			onClose={onClose}
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
