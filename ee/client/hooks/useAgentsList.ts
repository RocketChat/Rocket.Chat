import { useCallback, useState } from 'react';

import { useEndpoint } from '../../../client/contexts/ServerContext';
import { useScrollableRecordList } from '../../../client/hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../client/hooks/useComponentDidUpdate';
import { RecordList } from '../../../client/lib/lists/RecordList';
import { ILivechatAgentRecord } from '../../../definition/ILivechatAgentRecord';

type AgentsListOptions = {
	filter: string;
};

type getAgentsQuery = {
	text: string;
	offset: number;
	count: number;
};

export const useAgentsList = (
	options: AgentsListOptions,
): {
	itemsList: RecordList<ILivechatAgentRecord>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const [itemsList, setItemsList] = useState(() => new RecordList<ILivechatAgentRecord>());
	const reload = useCallback(() => setItemsList(new RecordList<ILivechatAgentRecord>()), []);

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
			} as getAgentsQuery);
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
