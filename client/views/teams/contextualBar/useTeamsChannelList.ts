import { useCallback, useMemo } from 'react';

import { getConfig } from '../../../../app/ui-utils/client/config';
import { IRoom } from '../../../../definition/IRoom';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { RecordList } from '../../../lib/lists/RecordList';

type TeamsChannelListOptions = {
	teamId: string;
	type: 'all' | 'autoJoin';
	text: string;
}

export const useTeamsChannelList = (
	options: TeamsChannelListOptions,
): {
		teamsChannelList: RecordList<IRoom>;
		initialItemCount: number;
		loadMoreItems: (start: number, end: number) => void;
	} => {
	const teamsChannelList = useMemo(() => new RecordList<IRoom>(), [options.teamId, options.type, options.text]);

	// useEffect(() => {
	// 	if (teamsChannelList.options !== options) {
	// 		teamsChannelList.updateFilters(options);
	// 	}
	// }, [teamsChannelList, options]);

	const apiEndPoint = useEndpoint('GET', 'teams.listRooms');

	const fetchData = useCallback(
		async (start, end) => {
			const { rooms, total } = await apiEndPoint({
				teamId: options.teamId,
				offset: start,
				count: end - start,
				query: JSON.stringify({
					name: { $regex: options.text || '', $options: 'i' },
					...options.type !== 'all' && {
						teamDefault: true,
					},
				}),
			});

			return {
				items: rooms.map((rooms) => {
					rooms._updatedAt = new Date(rooms._updatedAt);
					return { ...rooms };
				}),
				itemCount: total,
			};
		},
		[apiEndPoint, options.teamId, options.type, options.text],
	);


	const { loadMoreItems, initialItemCount } = useScrollableRecordList(teamsChannelList, fetchData, useMemo(() => {
		const filesListSize = getConfig('teamsChannelListSize');
		return filesListSize ? parseInt(filesListSize, 10) : undefined;
	}, []));

	return {
		teamsChannelList,
		loadMoreItems,
		initialItemCount,
	};
};
