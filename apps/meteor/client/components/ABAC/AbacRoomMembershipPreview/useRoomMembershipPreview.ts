import type { AbacMembershipGroup } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { usePreviewPages } from './usePreviewPages';

export const useRoomMembershipPreview = (rid: string, attributes: Record<string, string[]>, filter: string, group: AbacMembershipGroup) => {
	const { data, isPending, isError, error, isFetching, isFetchingNextPage, isFetchNextPageError, hasNextPage, fetchNextPage, refetch } =
		usePreviewPages(rid, attributes, filter, group);

	const userId = useUserId();
	const pages = data?.pages;
	const members = useMemo(() => {
		const loaded = pages?.flatMap((page) => page.members) ?? [];
		const editorRow = loaded.find(({ _id }) => _id === userId);
		return editorRow ? [editorRow, ...loaded.filter((member) => member !== editorRow)] : loaded;
	}, [pages, userId]);
	const checked = useMemo(() => pages?.reduce((sum, page) => sum + page.checked, 0) ?? 0, [pages]);

	return {
		members,
		checked,
		total: pages?.[0]?.total,
		isPending,
		isError,
		error,
		isRetrying: isError && isFetching,
		isChecking: isFetchingNextPage,
		isPartial: !isPending && !isError && !!hasNextPage,
		isExhausted: !isPending && !isError && !hasNextPage,
		loadMore: () => void (hasNextPage && !isFetching && fetchNextPage()),
		retry: () => void (isFetchNextPageError ? fetchNextPage({ cancelRefetch: false }) : refetch({ cancelRefetch: false })),
	};
};
