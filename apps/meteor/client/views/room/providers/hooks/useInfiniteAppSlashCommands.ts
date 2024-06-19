import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

const TEN_MINUTES_IN_SECONDS = 1000 * 60 * 10;
const ITEMS_PER_PAGE = 50;

export const useInfiniteAppSlashCommands = (count?: number) => {
	const getSlashCommands = useEndpoint('GET', '/v1/commands.list');
	return useInfiniteQuery({
		queryKey: ['apps', 'slashCommand'],
		queryFn: ({ pageParam }) => getSlashCommands({ count: count ?? ITEMS_PER_PAGE, offset: pageParam }),
		getNextPageParam: (lastPage) => lastPage.offset + lastPage.count,
		staleTime: TEN_MINUTES_IN_SECONDS,
		cacheTime: TEN_MINUTES_IN_SECONDS,
	});
};
