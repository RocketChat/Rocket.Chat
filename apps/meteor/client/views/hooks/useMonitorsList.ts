import type { ILivechatMonitorRecord } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

import { useScrollableRecordList } from '../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../hooks/useComponentDidUpdate';
import { RecordList } from '../../lib/lists/RecordList';

type MonitorsListOptions = {
	filter: string;
};

export const useMonitorsList = (
	options: MonitorsListOptions,
): {
	itemsList: RecordList<ILivechatMonitorRecord>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const [itemsList, setItemsList] = useState(() => new RecordList<ILivechatMonitorRecord>());
	const reload = useCallback(() => setItemsList(new RecordList<ILivechatMonitorRecord>()), []);

	const getMonitors = useEndpoint('GET', '/v1/livechat/monitors');

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start: number, end: number) => {
			const { monitors, total } = await getMonitors({
				text: options.filter,
				offset: start,
				count: end + start,
				sort: JSON.stringify({ username: 1 }),
			});

			return {
				items: monitors.map((members: any) => ({
					...members,
					label: members.username,
					value: members._id,
				})),
				itemCount: total,
			};
		},
		[getMonitors, options.filter],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(itemsList, fetchData, 25);
	return {
		reload,
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
