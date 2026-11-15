import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { CustomVirtuaScrollbars } from '@rocket.chat/ui-client';
import type { Key, ReactNode, Ref } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Virtualizer } from 'virtua';
import type { VirtualizerHandle, VirtualizerProps } from 'virtua';

import { useMergedRefsV2 } from '../../../hooks/useMergedRefsV2';

const scrollViewportStyle = {
	height: '100%',
	width: '100%',
	overflow: 'auto',
} as const;

/** First and last row, group headers included, that are at least partly inside the viewport. */
export type SidebarVirtualListRange = {
	startIndex: number;
	endIndex: number;
};

export type SidebarVirtualListGroup<TGroup, TItem> = {
	key: string;
	group: TGroup;
	items: readonly TItem[];
};

type SidebarVirtualListProps<TGroup, TItem> = {
	groups: readonly SidebarVirtualListGroup<TGroup, TItem>[];
	renderGroup: (group: TGroup, groupIndex: number) => ReactNode;
	renderItem: (item: TItem, itemIndex: number, group: TGroup, groupIndex: number, rowIndex: number) => ReactNode;
	getItemKey: (item: TItem, itemIndex: number, group: TGroup, groupIndex: number) => Key;
	bufferSize?: number;
	as?: VirtualizerProps['as'];
	onRangeChange?: (range: SidebarVirtualListRange) => void;
	ref?: Ref<VirtualizerHandle>;
};

type SidebarVirtualListRow<TGroup, TItem> =
	| {
			type: 'group';
			groupKey: string;
			group: TGroup;
			groupIndex: number;
	  }
	| {
			type: 'item';
			group: TGroup;
			groupIndex: number;
			item: TItem;
			itemIndex: number;
	  };

function SidebarVirtualList<TGroup, TItem>({
	groups,
	renderGroup,
	renderItem,
	getItemKey,
	bufferSize,
	as,
	onRangeChange,
	ref,
}: SidebarVirtualListProps<TGroup, TItem>) {
	const rows = useMemo(() => {
		return groups.flatMap<SidebarVirtualListRow<TGroup, TItem>>(({ key, group, items }, groupIndex) => [
			{
				type: 'group',
				groupKey: key,
				group,
				groupIndex,
			},
			...items.map((item, itemIndex) => ({
				type: 'item' as const,
				group,
				groupIndex,
				item,
				itemIndex,
			})),
		]);
	}, [groups]);

	const renderRow = useCallback(
		(row: SidebarVirtualListRow<TGroup, TItem>, rowIndex: number) => {
			if (row.type === 'group') {
				return <div key={`group:${row.groupKey}`}>{renderGroup(row.group, row.groupIndex)}</div>;
			}

			const itemKey = getItemKey(row.item, row.itemIndex, row.group, row.groupIndex);

			return <div key={`item:${String(itemKey)}`}>{renderItem(row.item, row.itemIndex, row.group, row.groupIndex, rowIndex)}</div>;
		},
		[getItemKey, renderGroup, renderItem],
	);

	const handleRef = useRef<VirtualizerHandle | null>(null);
	const viewportRef = useRef<HTMLDivElement | null>(null);
	const virtualizerRef = useMergedRefsV2(handleRef, ref);

	const reportRange = useStableCallback(() => {
		const handle = handleRef.current;
		const viewport = viewportRef.current;

		if (!onRangeChange || !handle || !viewport || viewport.clientHeight === 0) {
			return;
		}

		onRangeChange({
			startIndex: handle.findItemIndex(viewport.scrollTop),
			endIndex: handle.findItemIndex(viewport.scrollTop + viewport.clientHeight - 1),
		});
	});

	const observeViewport = useCallback(
		(node: HTMLDivElement) => {
			viewportRef.current = node;
			const observer = new ResizeObserver(reportRange);
			observer.observe(node);

			// Rows resizing (e.g. a view mode change) move what sits in the viewport without any scroll happening.
			if (node.firstElementChild) {
				observer.observe(node.firstElementChild);
			}

			return () => {
				observer.disconnect();
				viewportRef.current = null;
			};
		},
		[reportRange],
	);

	// Rows added or removed shift what sits in the viewport without any scroll happening.
	useEffect(() => reportRange(), [rows, reportRange]);

	return (
		<CustomVirtuaScrollbars>
			<div style={scrollViewportStyle} ref={observeViewport}>
				<Virtualizer ref={virtualizerRef} as={as} data={rows} bufferSize={bufferSize} onScroll={reportRange}>
					{renderRow}
				</Virtualizer>
			</div>
		</CustomVirtuaScrollbars>
	);
}

export default SidebarVirtualList;
