import { CustomVirtuaScrollbars } from '@rocket.chat/ui-client';
import type { Key, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { Virtualizer } from 'virtua';
import type { VirtualizerProps } from 'virtua';

const scrollViewportStyle = {
	height: '100%',
	width: '100%',
	overflow: 'auto',
} as const;

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

	return (
		<CustomVirtuaScrollbars>
			<div style={scrollViewportStyle}>
				<Virtualizer as={as} data={rows} bufferSize={bufferSize}>
					{renderRow}
				</Virtualizer>
			</div>
		</CustomVirtuaScrollbars>
	);
}

export default SidebarVirtualList;
