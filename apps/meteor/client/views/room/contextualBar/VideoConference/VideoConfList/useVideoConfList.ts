import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

import { VideoConfRecordList } from './VideoConfRecordList';
import { useScrollableRecordList } from '../../../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../../../hooks/useComponentDidUpdate';

export const useVideoConfList = (options: {
	roomId: IRoom['_id'];
}): {
	videoConfList: VideoConfRecordList;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const getVideoConfs = useEndpoint('GET', '/v1/video-conference.list');
	const [videoConfList, setVideoConfList] = useState(() => new VideoConfRecordList());
	const reload = useCallback(() => setVideoConfList(new VideoConfRecordList()), []);

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (_start: number, _end: number) => {
			const { data, total } = await getVideoConfs({
				roomId: options.roomId,
			});

			return {
				items: data.map((videoConf: any) => ({
					...videoConf,
					_updatedAt: new Date(videoConf._updatedAt),
					createdAt: new Date(videoConf.createdAt),
					endedAt: videoConf.endedAt ? new Date(videoConf.endedAt) : undefined,
				})),
				itemCount: total,
			};
		},
		[getVideoConfs, options],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(videoConfList, fetchData);

	return {
		reload,
		videoConfList,
		loadMoreItems,
		initialItemCount,
	};
};
