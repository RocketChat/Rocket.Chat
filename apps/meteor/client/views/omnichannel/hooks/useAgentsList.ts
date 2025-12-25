import type { ILivechatAgent, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

type AgentsListOptions = {
	filter: string;
	haveAll?: boolean;
	haveNoAgentsSelectedOption?: boolean;
	excludeId?: string;
	showIdleAgents?: boolean;
	onlyAvailable?: boolean;
	limit?: number;
};

type AgentOption = {
	_id: string;
	value: string;
	label: string;
};

const DEFAULT_QUERY_LIMIT = 25;

export const useAgentsList = (options: AgentsListOptions) => {
	const { t } = useTranslation();
	const getAgents = useEndpoint('GET', '/v1/livechat/users/agent');
	const {
		filter,
		onlyAvailable = false,
		showIdleAgents = true,
		excludeId,
		haveAll,
		haveNoAgentsSelectedOption,
		limit = DEFAULT_QUERY_LIMIT,
	} = options;

	const formatAgentItem = (agent: Serialized<ILivechatAgent>) => ({
		_id: agent._id,
		label: `${agent.name || agent._id} (@${agent.username})`,
		value: agent._id,
	});

	return useInfiniteQuery({
		queryKey: ['/v1/livechat/users/agent', { filter, onlyAvailable, showIdleAgents, excludeId, haveAll, haveNoAgentsSelectedOption }],
		queryFn: async ({ pageParam: offset = 0 }) => {
			const { users, ...data } = await getAgents({
				...(filter && { text: filter }),
				...(excludeId && { excludeId }),
				showIdleAgents,
				onlyAvailable,
				offset,
				count: limit,
				sort: `{ "name": 1 }`,
			});

			return {
				...data,
				users: users.map(formatAgentItem),
			};
		},
		select: (data) => {
			const items = data.pages.flatMap<AgentOption>((page) => page.users);

			if (haveAll) {
				items.unshift({
					label: t('All'),
					value: 'all',
					_id: 'all',
				});
			}

			if (haveNoAgentsSelectedOption) {
				items.unshift({
					label: t('Empty_no_agent_selected'),
					value: 'no-agent-selected',
					_id: 'no-agent-selected',
				});
			}

			return items;
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage) => {
			const offset = lastPage.offset + lastPage.count;
			return offset < lastPage.total ? offset : undefined;
		},
		initialData: () => ({
			pages: [{ users: [], offset: 0, count: 0, total: Infinity }],
			pageParams: [0],
		}),
	});
};
