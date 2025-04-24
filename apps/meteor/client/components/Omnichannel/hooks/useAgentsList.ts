import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

type AgentsListOptions = {
	text: string;
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
	const { text, onlyAvailable = false, showIdleAgents = true, excludeId, haveAll, haveNoAgentsSelectedOption, limit = 25 } = options;

	return useInfiniteQuery({
		queryKey: ['/v1/livechat/users/agent', { text, onlyAvailable, showIdleAgents, excludeId, haveAll, haveNoAgentsSelectedOption }],
		queryFn: async ({ pageParam: offset = 0 }) => {
			return getAgents({
				...(text && { text }),
				...(excludeId && { excludeId }),
				showIdleAgents,
				onlyAvailable,
				offset,
				count: limit ?? DEFAULT_QUERY_LIMIT,
				sort: `{ "name": 1 }`,
			});
		},
		select: (data) => {
			const items = data.pages.flatMap<AgentOption>(({ users }) => {
				return users.map((agent) => ({
					label: `${agent.name || agent._id} (@${agent.username})`,
					value: agent._id,
					_id: agent._id,
				}));
			});

			haveAll &&
				items.unshift({
					label: t('All'),
					value: 'all',
					_id: 'all',
				});

			haveNoAgentsSelectedOption &&
				items.unshift({
					label: t('Empty_no_agent_selected'),
					value: 'no-agent-selected',
					_id: 'no-agent-selected',
				});

			return items;
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage) => {
			const offset = lastPage.offset + lastPage.count;
			return offset < lastPage.total ? offset : undefined;
		},
		initialData: () => ({
			pages: [{ users: [], total: 0, offset: 0, count: limit ?? DEFAULT_QUERY_LIMIT }],
			pageParams: [0],
		}),
	});
};
