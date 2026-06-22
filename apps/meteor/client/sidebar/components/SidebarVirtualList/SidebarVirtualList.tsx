import { CustomVirtuaScrollbars } from '@rocket.chat/ui-client';
import type { Key, ReactNode } from 'react';
import { useMemo } from 'react';
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
	renderItem: (item: TItem, itemIndex: number, group: TGroup, groupIndex: number) => ReactNode;
	getItemKey: (item: TItem, itemIndex: number, group: TGroup, groupIndex: number) => Key;
	overscan?: number;
	as?: VirtualizerProps['as'];
};

type SidebarVirtualListRow = {
	key: string;
	content: ReactNode;
};

function SidebarVirtualList<TGroup, TItem>({
	groups,
	renderGroup,
	renderItem,
	getItemKey,
	overscan,
	as,
}: SidebarVirtualListProps<TGroup, TItem>) {
	const rows = useMemo(() => {
		return groups.flatMap<SidebarVirtualListRow>(({ key, group, items }, groupIndex) => [
			{
				key: `group:${key}`,
				content: renderGroup(group, groupIndex),
			},
			...items.map((item, itemIndex) => ({
				key: `item:${key}:${String(getItemKey(item, itemIndex, group, groupIndex))}`,
				content: renderItem(item, itemIndex, group, groupIndex),
			})),
		]);
	}, [getItemKey, groups, renderGroup, renderItem]);

	return (
		<CustomVirtuaScrollbars>
			<div style={scrollViewportStyle}>
				<Virtualizer as={as} bufferSize={overscan}>
					{rows.map(({ key, content }) => (
						<div key={key}>{content}</div>
					))}
				</Virtualizer>
			</div>
		</CustomVirtuaScrollbars>
	);
}

export default SidebarVirtualList;
