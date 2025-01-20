import type { ILivechatAgent } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { RecordList } from '../../../lib/lists/RecordList';

type AgentsListOptions = {
	text: string;
	includeExtension?: string;
};

export const useAvailableAgentsList = (
	options: AgentsListOptions,
): {
	itemsList: RecordList<ILivechatAgent>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const [itemsList, setItemsList] = useState(() => new RecordList<ILivechatAgent>());
	const reload = useCallback(() => setItemsList(new RecordList<ILivechatAgent>()), []);

	const getAgents = useEndpoint('GET', '/v1/omnichannel/agents/available');

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start: number, end: number) => {
			const { agents, total } = await getAgents({
				...(options.text && { text: options.text }),
				...(options.includeExtension && { includeExtension: options.includeExtension }),
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

			return {
				items,
				itemCount: total,
			};
		},
		[getAgents, options.includeExtension, options.text],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(itemsList, fetchData, 25);

	return {
		reload,
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
