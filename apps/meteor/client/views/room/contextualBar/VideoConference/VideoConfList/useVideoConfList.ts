import type { IGroupVideoConference, IRoom } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

import { useScrollableRecordList } from '../../../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../../../hooks/useComponentDidUpdate';
import { RecordList } from '../../../../../lib/lists/RecordList';

export const useVideoConfList = (options: {
	roomId: IRoom['_id'];
}): {
	videoConfList: RecordList<IGroupVideoConference>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const getVideoConfs = useEndpoint('GET', '/v1/video-conference.list');
	const [videoConfList, setVideoConfList] = useState(() => new RecordList<IGroupVideoConference>());
	const reload = useCallback(() => setVideoConfList(new RecordList<IGroupVideoConference>()), []);

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (_start, _end) => {
			const { data, total } = await getVideoConfs({
				roomId: options.roomId,
			});

			return {
				items: data.map((videoConf: any) => ({
					...videoConf,
					_updatedAt: new Date(videoConf._updatedAt),
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
