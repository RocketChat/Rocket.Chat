import { useCallback, useState } from 'react';

import { useEndpoint } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { RecordList } from '../../../lib/lists/RecordList';

type AgentsListOptions = {
	text: string;
	haveAll: boolean;
};

type PaginatedOptionType = {
	_id: string;
	_updatedAt: Date;
	value: string | number;
	label: string;
};

export const useAgentsList = (
	options: AgentsListOptions,
): {
	itemsList: RecordList<PaginatedOptionType>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const t = useTranslation();
	const [itemsList, setItemsList] = useState(() => new RecordList<PaginatedOptionType>());
	const reload = useCallback(() => setItemsList(new RecordList<PaginatedOptionType>()), []);
	const endpoint = 'livechat/users/agent';

	const getAgents = useEndpoint('GET', endpoint);

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start, end) => {
			const { users: agents, total } = await getAgents({
				...(options.text && { text: options.text }),
				offset: start,
				count: end + start,
				sort: `{ "name": 1 }`,
			});

			const items = agents.map((agent: any) => ({
				_id: agent._id,
				value: agent._id,
				label: agent.name || agent.username,
				_updatedAt: new Date(agent._updatedAt),
			}));

			options.haveAll &&
				items.unshift({
					_id: 'all',
					label: t('All'),
					value: 'all',
					_updatedAt: new Date(),
				});

			return {
				items,
				itemCount: total + 1,
			};
		},
		[getAgents, options.haveAll, options.text, t],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(itemsList, fetchData, 25);

	return {
		reload,
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
