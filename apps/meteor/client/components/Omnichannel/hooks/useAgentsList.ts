import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { RecordList } from '../../../lib/lists/RecordList';

type AgentsListOptions = {
	text: string;
	haveAll?: boolean;
	haveNoAgentsSelectedOption?: boolean;
	excludeId?: string;
	showIdleAgents?: boolean;
	onlyAvailable?: boolean;
};

type AgentOption = { value: string; label: string; _updatedAt: Date; _id: string };

export const useAgentsList = (
	options: AgentsListOptions,
): {
	itemsList: RecordList<AgentOption>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const { t } = useTranslation();
	const [itemsList, setItemsList] = useState(() => new RecordList<AgentOption>());
	const reload = useCallback(() => setItemsList(new RecordList<AgentOption>()), []);

	const getAgents = useEndpoint('GET', '/v1/livechat/users/agent');
	const { text, onlyAvailable = false, showIdleAgents = true, excludeId, haveAll, haveNoAgentsSelectedOption } = options;

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start: number, end: number) => {
			const { users: agents, total } = await getAgents({
				...(text && { text }),
				...(excludeId && { excludeId }),
				showIdleAgents,
				onlyAvailable,
				offset: start,
				count: end + start,
				sort: `{ "name": 1 }`,
			});

			const items = agents.map<AgentOption>((agent) => {
				const agentOption = {
					_updatedAt: new Date(agent._updatedAt),
					label: `${agent.name || agent._id} (@${agent.username})`,
					value: agent._id,
					_id: agent._id,
				};
				return agentOption;
			});

			haveAll &&
				items.unshift({
					label: t('All'),
					value: 'all',
					_updatedAt: new Date(),
					_id: 'all',
				});

			haveNoAgentsSelectedOption &&
				items.unshift({
					label: t('Empty_no_agent_selected'),
					value: 'no-agent-selected',
					_updatedAt: new Date(),
					_id: 'no-agent-selected',
				});

			return {
				items,
				itemCount: total,
			};
		},
		[excludeId, getAgents, haveAll, haveNoAgentsSelectedOption, onlyAvailable, showIdleAgents, t, text],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(itemsList, fetchData, 25);

	return {
		reload,
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
