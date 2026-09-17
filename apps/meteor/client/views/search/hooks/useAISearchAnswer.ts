import type { SearchAnswer } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useAISearchAnswer = (query: string, messages: SearchAnswer['messages'], enabled: boolean) => {
	const generateAnswer = useEndpoint('POST', '/v1/ai.search.answer');

	return useQuery({
		queryKey: ['search/intelligent/answer', query, messages],
		queryFn: ({ signal }) => generateAnswer({ query, messages }, { signal }),
		enabled,
		staleTime: Infinity,
		retry: false,
	});
};
