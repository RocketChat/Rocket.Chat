import { useCallback, useState } from 'react';

import { ILivechatAgentRecord } from '../../../../definition/ILivechatAgentRecord';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { RecordList } from '../../../lib/lists/RecordList';

type AgentsListOptions = {
	filter: string;
};

export const useAgentsList = (
	options: AgentsListOptions,
): {
	itemsList: RecordList<ILivechatAgentRecord>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const t = useTranslation();
	const [itemsList, setItemsList] = useState(() => new RecordList<ILivechatAgentRecord>());
	const reload = useCallback(() => setItemsList(new RecordList<ILivechatAgentRecord>()), []);
	const endpoint = 'livechat/users/agent';

	const getAgents = useEndpoint('GET', endpoint);

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start, end) => {
			const { users: agents, total } = await getAgents({
				text: options.filter,
				offset: start,
				count: end + start,
				sort: JSON.stringify({ name: 1 }),
			});

			const items = agents.map((agent: any) => {
				agent._updatedAt = new Date(agent._updatedAt);
				agent.value = { value: agent._id, label: agent.name };
				return agent;
			});
			items.unshift({ value: { value: '', label: t('All') }, _updatedAt: new Date() });

			return {
				items,
				itemCount: total + 1,
			};
		},
		[getAgents, options.filter, t],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(itemsList, fetchData, 25);

	return {
		reload,
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
