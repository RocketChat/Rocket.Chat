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

export const useInfiniteAvailableAgentsList = (options: AgentsListOptions) => {
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
				...(options.text && { text: options.text }),
				...(options.includeExtension && { includeExtension: options.includeExtension }),
				offset,
				count: options.limit ?? 25,
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
	});
};
