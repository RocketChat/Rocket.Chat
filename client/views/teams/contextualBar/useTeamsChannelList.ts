import { useCallback, useMemo, useState } from 'react';

import { getConfig } from '../../../../app/ui-utils/client/config';
import { IRoom } from '../../../../definition/IRoom';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
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
		reset: () => void;
		loadMoreItems: (start: number, end: number) => void;
	} => {
	const apiEndPoint = useEndpoint('GET', 'teams.listRooms');
	const [teamsChannelList, setTeamsChannelList] = useState(() => new RecordList<IRoom>());
	const reset = useCallback(() => setTeamsChannelList(new RecordList<IRoom>()), []);

	useComponentDidUpdate(() => {
		options && reset();
	}, [options, reset]);

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
		[apiEndPoint, options],
	);


	const { loadMoreItems, initialItemCount } = useScrollableRecordList(teamsChannelList, fetchData, useMemo(() => {
		const filesListSize = getConfig('teamsChannelListSize');
		return filesListSize ? parseInt(filesListSize, 10) : undefined;
	}, []));

	return {
		reset,
		teamsChannelList,
		loadMoreItems,
		initialItemCount,
	};
};
