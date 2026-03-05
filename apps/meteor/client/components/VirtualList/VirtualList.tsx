import { CustomScrollbars } from '@rocket.chat/ui-client';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';

type VirtualListProps<T> = {
	items: T[];
	totalCount: number;
	renderItem: (item: T, index: number) => ReactNode;
	/**
	 * Estimated height of each item in pixels. Per TanStack Virtual docs, when using
	 * dynamic measurement it's recommended to estimate the largest likely size for
	 * smoother scrolling. Receives the item index so callers can vary the estimate
	 * by position if needed. Defaults to () => 120.
	 */
	estimateSize?: (index: number) => number;
	/**
	 * Number of extra items to render above and below the visible area.
	 * Higher values reduce blank rows during fast scrolling at the cost of render
	 * time. TanStack Virtual default is 1; we default to 5 as a balanced value.
	 */
	overscan?: number;
	/** Pixel gap between each item, handled natively by the virtualizer. */
	gap?: number;
	/** Pixel padding applied before the first item. */
	paddingStart?: number;
	/** Pixel padding applied after the last item. */
	paddingEnd?: number;
	/** Called when the last rendered item is visible and more items remain to load. */
	onEndReached?: () => void;
};

/**
 * Headless virtual list built on @tanstack/react-virtual.
 *
 * Intended as a single shared replacement for all Virtuoso + VirtualizedScrollbars
 * usages across the contextual-bar panels (Discussions, Threads, Files, Members…).
 * Consumers only supply items and a render function — all virtualizer wiring lives here.
 */
const VirtualList = <T,>({
	items,
	totalCount,
	renderItem,
	estimateSize = () => 120,
	overscan = 5,
	gap,
	paddingStart,
	paddingEnd,
	onEndReached,
}: VirtualListProps<T>) => {
	const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => scrollElement,
		estimateSize,
		overscan,
		...(gap !== undefined && { gap }),
		...(paddingStart !== undefined && { paddingStart }),
		...(paddingEnd !== undefined && { paddingEnd }),
	});

	const virtualItems = virtualizer.getVirtualItems();
	const lastVirtualItem = virtualItems[virtualItems.length - 1];

	useEffect(() => {
		if (lastVirtualItem && lastVirtualItem.index >= items.length - 1 && items.length < totalCount) {
			onEndReached?.();
		}
	}, [lastVirtualItem, items.length, totalCount, onEndReached]);

	return (
		<CustomScrollbars ref={setScrollElement}>
			<div
				style={{
					height: virtualizer.getTotalSize(),
					width: '100%',
					position: 'relative',
				}}
			>
				{virtualItems.map((virtualRow) => (
					<div
						key={virtualRow.key}
						data-index={virtualRow.index}
						ref={virtualizer.measureElement}
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							transform: `translateY(${virtualRow.start}px)`,
						}}
					>
						{renderItem(items[virtualRow.index], virtualRow.index)}
					</div>
				))}
			</div>
		</CustomScrollbars>
	);
};

export default VirtualList;
