import type { ILivechatAgent } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

import { useScrollableRecordList } from '../../../client/hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../client/hooks/useComponentDidUpdate';
import { RecordList } from '../../../client/lib/lists/RecordList';

type AgentsListOptions = {
	filter: string;
};

export const useAgentsList = (
	options: AgentsListOptions,
): {
	itemsList: RecordList<ILivechatAgent>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const [itemsList, setItemsList] = useState(() => new RecordList<ILivechatAgent>());
	const reload = useCallback(() => setItemsList(new RecordList<ILivechatAgent>()), []);

	const getAgents = useEndpoint('GET', 'livechat/users/agent');

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start, end) => {
			const { users, total } = await getAgents({
				text: options.filter,
				offset: start,
				count: end + start,
			});
			return {
				items: users.map((agent: any) => {
					agent._updatedAt = new Date(agent._updatedAt);
					agent.label = agent.name;
					agent.value = { value: agent._id, label: agent.name };
					return agent;
				}),
				itemCount: total,
			};
		},
		[getAgents, options.filter],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(itemsList, fetchData, 25);

	return {
		reload,
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
