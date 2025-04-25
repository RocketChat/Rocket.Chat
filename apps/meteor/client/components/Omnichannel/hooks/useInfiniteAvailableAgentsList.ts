import type { Serialized, ILivechatAgent } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

type AgentsListOptions = {
	text: string;
	includeExtension?: string;
	limit?: number;
};

type AgentOption = {
	_id: string;
	label: string;
	value: string;
};

const DEFAULT_QUERY_LIMIT = 25;

export const useInfiniteAvailableAgentsList = (options: AgentsListOptions) => {
	const { text, includeExtension, limit = DEFAULT_QUERY_LIMIT } = options;
	const getAgents = useEndpoint('GET', '/v1/omnichannel/agents/available');

	const formatTagItem = (agent: Serialized<ILivechatAgent>): AgentOption => ({
		_id: agent._id,
		label: agent.username ?? '',
		value: agent._id,
	});

	return useInfiniteQuery({
		queryKey: ['/v1/livechat/tags', options],
		queryFn: async ({ pageParam: offset = 0 }) => {
			const { agents, ...data } = await getAgents({
				...(text && { text }),
				...(includeExtension && { includeExtension }),
				offset,
				count: limit,
				sort: `{ "username": 1 }`,
			});

			return {
				...data,
				agents: agents.map(formatTagItem),
			};
		},
		select: (data) => data.pages.flatMap<AgentOption>((page) => page.agents),
		initialPageParam: 0,
		getNextPageParam: (lastPage) => {
			const offset = lastPage.offset + lastPage.count;
			return offset < lastPage.total ? offset : undefined;
		},
		initialData: () => ({
			pages: [{ agents: [], offset: 0, count: 0, total: Infinity }],
			pageParams: [0],
		}),
	});
};
