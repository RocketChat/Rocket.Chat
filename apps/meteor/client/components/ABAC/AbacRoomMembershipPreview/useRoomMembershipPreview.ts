import type { AbacMembershipGroup } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo } from 'react';

import { useRoomMembershipPreviewPages } from './useRoomMembershipPreviewPages';

const FILL_MEMBERS = 25;
const FILL_PAGES = 3;

export const useRoomMembershipPreview = (rid: string, attributes: Record<string, string[]>, filter: string, group: AbacMembershipGroup) => {
	const { data, isPending, isError, error, isFetching, isFetchingNextPage, isFetchNextPageError, hasNextPage, fetchNextPage, refetch } =
		useRoomMembershipPreviewPages(rid, attributes, filter, group);

	const userId = useUserId();
	const pages = data?.pages;
	const members = useMemo(() => {
		const loaded = pages?.flatMap((page) => page.members) ?? [];
		const editorRow = loaded.find(({ _id }) => _id === userId);
		return editorRow ? [editorRow, ...loaded.filter((member) => member !== editorRow)] : loaded;
	}, [pages, userId]);
	const checked = useMemo(() => pages?.reduce((sum, page) => sum + page.checked, 0) ?? 0, [pages]);

	const pageCount = pages?.length ?? 0;
	const canFetchMore = !!hasNextPage && !isFetching && !isError;
	const isFilling = !!hasNextPage && !isError && members.length < FILL_MEMBERS && pageCount < FILL_PAGES;
	const isScrollable = members.length >= FILL_MEMBERS;

	useEffect(() => {
		if (canFetchMore && isFilling) {
			void fetchNextPage();
		}
	}, [canFetchMore, isFilling, pageCount, fetchNextPage]);

	const loadMore = () => void (canFetchMore && fetchNextPage());

	return {
		members,
		checked,
		total: pages?.[0]?.total,
		isPending,
		isError,
		error,
		isRetrying: isError && isFetching,
		isChecking: isFetchingNextPage || isFilling,
		isPartial: !isPending && !isError && !!hasNextPage && !isFilling,
		isExhausted: !isPending && !isError && !hasNextPage,
		onEndReached: () => isScrollable && loadMore(),
		loadMore,
		retry: () => void (isFetchNextPageError ? fetchNextPage({ cancelRefetch: false }) : refetch({ cancelRefetch: false })),
	};
};
