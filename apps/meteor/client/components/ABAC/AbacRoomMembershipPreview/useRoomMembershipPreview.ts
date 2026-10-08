import type { AbacMembershipGroup } from '@rocket.chat/core-typings';
import { useEffect, useMemo, useRef, useState } from 'react';

import { usePreviewPages } from './usePreviewPages';

export const PREVIEW_MIN_SHOWN = 25;
export const PREVIEW_AUTO_FETCH_PAGES = 2;

type LoopState = {
	scope: string;
	budget: number;
	target: number;
	stopped: boolean;
};

const freshLoop = (scope: string, shown = 0, budget = PREVIEW_AUTO_FETCH_PAGES): LoopState => ({
	scope,
	budget,
	target: shown + PREVIEW_MIN_SHOWN,
	stopped: false,
});

export const useRoomMembershipPreview = (
	rid: string,
	attributes: Record<string, string[]>,
	filter: string,
	group: AbacMembershipGroup,
	paused = false,
) => {
	const { data, isPending, isError, error, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } = usePreviewPages(
		rid,
		attributes,
		filter,
		group,
	);

	const scope = `${group}:${filter}`;
	const [storedLoop, setLoop] = useState<LoopState>(() => freshLoop(scope));
	const loop = storedLoop.scope === scope ? storedLoop : freshLoop(scope);

	const pages = data?.pages;
	const members = useMemo(() => pages?.flatMap((page) => page.members) ?? [], [pages]);
	const checked = useMemo(() => pages?.reduce((sum, page) => sum + page.checked, 0) ?? 0, [pages]);
	const total = pages?.[0]?.total;

	const needsMore = !isError && !!hasNextPage && !loop.stopped && members.length < loop.target;
	const wantsMore = needsMore && !paused;
	const canAutoFetch = wantsMore && loop.budget > 0;
	const inFlight = useRef(false);

	useEffect(() => {
		if (!canAutoFetch || isFetching || inFlight.current) {
			return;
		}
		inFlight.current = true;
		setLoop({ ...loop, budget: loop.budget - 1 });
		void fetchNextPage({ cancelRefetch: false }).finally(() => {
			inFlight.current = false;
		});
	}, [canAutoFetch, isFetching, loop, fetchNextPage]);

	const isChecking = !isError && !loop.stopped && !paused && (isFetchingNextPage || canAutoFetch);
	const isCapped = needsMore && loop.budget <= 0 && !isFetching;
	const isStopped = loop.stopped && !!hasNextPage;

	const resume = (budget: number) => {
		if (isError || !hasNextPage || paused) {
			return;
		}
		setLoop(freshLoop(scope, members.length, budget));
	};

	return {
		members,
		checked,
		total,
		isPending,
		isError,
		error,
		isChecking,
		isPartial: isStopped || isCapped,
		isExhausted: !isPending && !isError && !hasNextPage,
		onEndReached: () => {
			if (!needsMore && !loop.stopped && !isFetching) {
				resume(PREVIEW_AUTO_FETCH_PAGES);
			}
		},
		loadMore: () => resume(Infinity),
		stop: () => setLoop({ ...loop, stopped: true }),
	};
};
