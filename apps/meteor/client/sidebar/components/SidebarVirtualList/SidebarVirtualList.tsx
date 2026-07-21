import { CustomVirtuaScrollbars } from '@rocket.chat/ui-client';
import type { CSSProperties, Key, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Virtualizer } from 'virtua';
import type { VirtualizerHandle, VirtualizerProps } from 'virtua';

const scrollViewportStyle = {
	height: '100%',
	width: '100%',
	overflow: 'auto',
} as const;

const activeStickyGroupStyle = {
	position: 'sticky',
	top: 0,
	width: '100%',
	zIndex: 1,
} as const satisfies CSSProperties;

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
	overscan?: number;
	as?: VirtualizerProps['as'];
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
			groupKey: string;
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
	overscan,
	as,
}: SidebarVirtualListProps<TGroup, TItem>) {
	const virtualizerRef = useRef<VirtualizerHandle>(null);
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
				groupKey: key,
				group,
				groupIndex,
				item,
				itemIndex,
			})),
		]);
	}, [groups]);

	const groupHeaderIndexes = useMemo(
		() =>
			rows.reduce<number[]>((indexes, row, index) => {
				if (row.type === 'group') {
					indexes.push(index);
				}
				return indexes;
			}, []),
		[rows],
	);

	const [activeStickyGroupIndex, setActiveStickyGroupIndex] = useState(() => groupHeaderIndexes[0] ?? 0);

	const updateActiveStickyGroup = useCallback(() => {
		const handle = virtualizerRef.current;
		if (!handle || groupHeaderIndexes.length === 0) {
			return;
		}

		const start = handle.findItemIndex(handle.scrollOffset);
		const activeIndex = [...groupHeaderIndexes].reverse().find((index) => start >= index) ?? groupHeaderIndexes[0];

		setActiveStickyGroupIndex((current) => (current === activeIndex ? current : activeIndex));
	}, [groupHeaderIndexes]);

	useEffect(() => {
		updateActiveStickyGroup();
	}, [groupHeaderIndexes, updateActiveStickyGroup]);

	const handleScroll = useCallback(() => {
		updateActiveStickyGroup();
	}, [updateActiveStickyGroup]);

	const keepMounted = useMemo(
		() => (groupHeaderIndexes.length > 0 ? [activeStickyGroupIndex] : undefined),
		[activeStickyGroupIndex, groupHeaderIndexes.length],
	);

	const renderRow = useCallback(
		(row: SidebarVirtualListRow<TGroup, TItem>, rowIndex: number) => {
			if (row.type === 'group') {
				const isActiveStickyGroup = rowIndex === activeStickyGroupIndex;

				return (
					<div
						key={`group:${row.groupKey}`}
						{...(isActiveStickyGroup ? { 'data-testid': 'virtuoso-top-item-list' } : {})}
						style={isActiveStickyGroup ? activeStickyGroupStyle : undefined}
					>
						{renderGroup(row.group, row.groupIndex)}
					</div>
				);
			}

			const itemKey = getItemKey(row.item, row.itemIndex, row.group, row.groupIndex);

			return (
				<div key={`item:${row.groupKey}:${String(itemKey)}`}>
					{renderItem(row.item, row.itemIndex, row.group, row.groupIndex, rowIndex)}
				</div>
			);
		},
		[activeStickyGroupIndex, getItemKey, renderGroup, renderItem],
	);

	return (
		<CustomVirtuaScrollbars>
			<div style={scrollViewportStyle}>
				<Virtualizer ref={virtualizerRef} as={as} data={rows} bufferSize={overscan} keepMounted={keepMounted} onScroll={handleScroll}>
					{renderRow}
				</Virtualizer>
			</div>
		</CustomVirtuaScrollbars>
	);
}

export default SidebarVirtualList;
