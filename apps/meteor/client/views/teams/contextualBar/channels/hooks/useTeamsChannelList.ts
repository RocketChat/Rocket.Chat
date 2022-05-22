import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo, useState } from 'react';

import { useScrollableRecordList } from '../../../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../../../hooks/useComponentDidUpdate';
import { RecordList } from '../../../../../lib/lists/RecordList';
import { getConfig } from '../../../../../lib/utils/getConfig';
import { mapMessageFromApi } from '../../../../../lib/utils/mapMessageFromApi';

type TeamsChannelListOptions = {
	teamId: string;
	type: 'all' | 'autoJoin';
	text: string;
};

export const useTeamsChannelList = (
	options: TeamsChannelListOptions,
): {
	teamsChannelList: RecordList<IRoom>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const apiEndPoint = useEndpoint('GET', 'teams.listRooms');
	const [teamsChannelList, setTeamsChannelList] = useState(() => new RecordList<IRoom>());
	const reload = useCallback(() => setTeamsChannelList(new RecordList<IRoom>()), []);

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start, end) => {
			const { rooms, total } = await apiEndPoint({
				teamId: options.teamId,
				offset: start,
				count: end,
				filter: options.text,
				type: options.type,
			});

			return {
				items: rooms.map(({ _updatedAt, lastMessage, lm, ts, jitsiTimeout, webRtcCallStartTime, ...room }) => ({
					...(jitsiTimeout && { jitsiTimeout: new Date(jitsiTimeout) }),
					...(lm && { lm: new Date(lm) }),
					...(ts && { ts: new Date(ts) }),
					_updatedAt: new Date(_updatedAt),
					...(lastMessage && { lastMessage: mapMessageFromApi(lastMessage) }),
					...(webRtcCallStartTime && { webRtcCallStartTime: new Date(webRtcCallStartTime) }),
					...room,
				})),
				itemCount: total,
			};
		},
		[apiEndPoint, options],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(
		teamsChannelList,
		fetchData,
		useMemo(() => {
			const filesListSize = getConfig('teamsChannelListSize');
			return filesListSize ? parseInt(filesListSize, 10) : undefined;
		}, []),
	);

	return {
		reload,
		teamsChannelList,
		loadMoreItems,
		initialItemCount,
	};
};
