import { useInfiniteQuery } from 'react-query';

// import { useUserPreference } from '../../../../contexts/UserContext';
import { callWithErrorHandling } from '../../../../lib/utils/callWithErrorHandling';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useMessageListQuery = (rid: string) =>
	// const showInMainThread = useUserPreference<boolean>('showMessageInMainThread', false);

	useInfiniteQuery(
		['message-list', rid],
		({ pageParam: { ts, prev } = {} }: { pageParam?: { ts?: Date; prev?: boolean } }) => {
			if (prev) {
				return callWithErrorHandling('loadNextMessages', rid, ts, 50);
			}

			return callWithErrorHandling('loadHistory', rid, ts, 50); // , asd, showInMainThread);
		},
		{
			keepPreviousData: true,
			getNextPageParam(lastPage) {
				return (
					lastPage?.messages?.length && { ts: lastPage.messages[lastPage.messages.length - 1].ts }
				);
			},
			getPreviousPageParam: (firstPage) => ({ prev: true, ts: firstPage.messages[0].ts }),
			select: (data) => ({
				pages: data.pages.map((page) => {
					page.messages = page.messages.reverse();
					return page;
				}),
				pageParams: [...data.pageParams].reverse(),
			}),
		},
	);
