import type { ILivechatAgent } from '@rocket.chat/core-typings';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { RecordList } from '../../../lib/lists/RecordList';

type AgentsListOptions = {
	text: string;
	haveAll: boolean;
};

export const useAgentsList = (
	options: AgentsListOptions,
): {
	itemsList: RecordList<ILivechatAgent>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const t = useTranslation();
	const [itemsList, setItemsList] = useState(() => new RecordList<ILivechatAgent>());
	const reload = useCallback(() => setItemsList(new RecordList<ILivechatAgent>()), []);
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

			const items = agents.map((agent: any) => {
				agent._updatedAt = new Date(agent._updatedAt);
				agent.label = agent.username;
				agent.value = agent._id;
				return agent;
			});

			options.haveAll &&
				items.unshift({
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
