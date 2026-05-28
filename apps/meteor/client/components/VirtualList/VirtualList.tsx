import { CustomVirtuaScrollbars } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { VirtualizerHandle } from 'virtua';
import { Virtualizer } from 'virtua';

import { VirtuaListContainer } from './VirtuaListContainer';

const NEAR_BOTTOM_THRESHOLD = -20;

const scrollViewportStyle = {
	height: '100%',
	width: '100%',
	overflow: 'auto',
} as const;

type OnEndReached = () => void | Promise<unknown>;

const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as PromiseLike<unknown> | null)?.then === 'function';

type VirtualListProps<T extends { _id: string }> = {
	items: T[];
	totalCount: number;
	renderItem: (item: T, index: number) => ReactNode;
	estimateSize?: (index: number) => number;
	overscan?: number;
	onEndReached?: OnEndReached;
};

function VirtualList<T extends { _id: string }>({
	items,
	totalCount,
	renderItem,
	estimateSize = () => 120,
	overscan,
	onEndReached,
}: VirtualListProps<T>) {
	const virtualizerRef = useRef<VirtualizerHandle | null>(null);
	const onEndReachedRef = useRef(onEndReached);
	const lastEndReachKeyRef = useRef<string | null>(null);
	const firstItemId = items[0]?._id ?? '';
	const lastItemId = items[items.length - 1]?._id ?? '';

	useEffect(() => {
		onEndReachedRef.current = onEndReached;
	}, [onEndReached]);

	const checkEndReached = useCallback(
		(offset: number) => {
			const handle = virtualizerRef.current;
			const loadMore = onEndReachedRef.current;
			if (!handle || !loadMore) {
				return;
			}

			const { scrollSize, viewportSize } = handle;
			if (viewportSize <= 0) {
				return;
			}

			if (items.length >= totalCount) {
				return;
			}

			const nearBottom = offset - scrollSize + viewportSize >= NEAR_BOTTOM_THRESHOLD;
			if (!nearBottom) {
				return;
			}

			const key = `${firstItemId}:${lastItemId}:${items.length}:${totalCount}`;
			if (lastEndReachKeyRef.current === key) {
				return;
			}
			lastEndReachKeyRef.current = key;

			const releaseEndReachLock = () => {
				if (lastEndReachKeyRef.current === key) {
					lastEndReachKeyRef.current = null;
				}
			};

			try {
				const result = loadMore();
				if (isThenable(result)) {
					void Promise.resolve(result).catch(releaseEndReachLock);
				}
			} catch {
				releaseEndReachLock();
			}
		},
		[firstItemId, items.length, lastItemId, totalCount],
	);

	const handleScroll = useCallback(
		(offset: number) => {
			checkEndReached(offset);
		},
		[checkEndReached],
	);

	useLayoutEffect(() => {
		const handle = virtualizerRef.current;
		if (!handle) {
			return;
		}
		checkEndReached(handle.scrollOffset);
	}, [checkEndReached, items.length, totalCount]);

	return (
		<CustomVirtuaScrollbars>
			<div style={scrollViewportStyle}>
				<Virtualizer ref={virtualizerRef} as={VirtuaListContainer} item='li' bufferSize={overscan} onScroll={handleScroll}>
					{items.map((item, index) => (
						<div key={item._id} style={{ minHeight: estimateSize(index) }}>
							{renderItem(item, index)}
						</div>
					))}
				</Virtualizer>
			</div>
		</CustomVirtuaScrollbars>
	);
}

export default VirtualList;
