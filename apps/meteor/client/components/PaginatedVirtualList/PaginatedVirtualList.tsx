import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { CustomVirtuaScrollbars } from '@rocket.chat/ui-client';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCallback, useLayoutEffect, useRef } from 'react';
import type { VirtualizerHandle } from 'virtua';
import { Virtualizer } from 'virtua';

import { VirtuaPresentation } from './VirtuaPresentation';

const NEAR_BOTTOM_THRESHOLD = -20;

const scrollViewportStyle = {
	height: '100%',
	width: '100%',
	overflow: 'auto',
} as const;

type PaginatedVirtualListProps<T extends { _id: string }> = {
	'items': T[];
	'totalCount': number;
	'renderItem': (item: T, index: number) => ReactNode;
	'overscan'?: number;
	'onEndReached'?: UseInfiniteQueryResult['fetchNextPage'];
	'aria-label': string;
};

function PaginatedVirtualList<T extends { _id: string }>({
	items,
	totalCount,
	renderItem,
	overscan,
	onEndReached,
	'aria-label': ariaLabel,
}: PaginatedVirtualListProps<T>) {
	const virtualizerRef = useRef<VirtualizerHandle | null>(null);
	const isEndReachedLockedRef = useRef(false);
	const firstItemId = items[0]?._id ?? '';
	const lastItemId = items[items.length - 1]?._id ?? '';

	const checkEndReached = useCallback(
		async (offset: number) => {
			if (isEndReachedLockedRef.current) {
				return;
			}

			const handle = virtualizerRef.current;

			if (!handle || !onEndReached) {
				return;
			}

			const { scrollSize, viewportSize } = handle;
			if (viewportSize <= 0 || items.length >= totalCount) {
				return;
			}

			const nearBottom = offset - scrollSize + viewportSize >= NEAR_BOTTOM_THRESHOLD;
			if (!nearBottom) {
				return;
			}

			isEndReachedLockedRef.current = true;

			try {
				await onEndReached();
			} catch {
				isEndReachedLockedRef.current = false;
			}
		},
		[items.length, onEndReached, totalCount],
	);

	const handleScroll = useDebouncedCallback(
		(offset: number) => {
			checkEndReached(offset);
		},
		300,
		[checkEndReached],
	);

	useLayoutEffect(() => {
		isEndReachedLockedRef.current = false;

		const handle = virtualizerRef.current;
		if (!handle) {
			return;
		}
		checkEndReached(handle.scrollOffset);
	}, [checkEndReached, firstItemId, items.length, lastItemId, totalCount]);

	return (
		<CustomVirtuaScrollbars>
			<div role='list' aria-label={ariaLabel} style={scrollViewportStyle}>
				<Virtualizer ref={virtualizerRef} as={VirtuaPresentation} item={VirtuaPresentation} bufferSize={overscan} onScroll={handleScroll}>
					{items.map((item, index) => (
						<div key={item._id} role='listitem' aria-posinset={index + 1} aria-setsize={totalCount}>
							{renderItem(item, index)}
						</div>
					))}
				</Virtualizer>
			</div>
		</CustomVirtuaScrollbars>
	);
}

export default PaginatedVirtualList;
