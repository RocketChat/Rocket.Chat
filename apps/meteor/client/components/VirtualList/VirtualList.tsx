import { CustomScrollbars } from '@rocket.chat/ui-client';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';

type VirtualListProps<T> = {
	items: T[];
	totalCount: number;
	renderItem: (item: T, index: number) => ReactNode;
	estimateSize?: (index: number) => number;
	overscan?: number;
	gap?: number;
	paddingStart?: number;
	paddingEnd?: number;
	onEndReached?: () => void;
};

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
		gap,
		paddingStart,
		paddingEnd,
	});

	const virtualItems = virtualizer.getVirtualItems();
	const lastVirtualItemIndex = virtualItems[virtualItems.length - 1]?.index;

	useEffect(() => {
		if (lastVirtualItemIndex !== undefined && lastVirtualItemIndex >= items.length - 1 && items.length < totalCount) {
			onEndReached?.();
		}
	}, [lastVirtualItemIndex, items.length, totalCount, onEndReached]);

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
