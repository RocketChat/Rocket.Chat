import { Box } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GroupedVirtuoso } from 'react-virtuoso';

import RoomListCollapser from './RoomListCollapser';
import RoomsListFilters from './RoomListFilters';
import RoomListRow from './RoomListRow';
import RoomListRowWrapper from './RoomListRowWrapper';
import RoomListWrapper from './RoomListWrapper';
import { VirtualizedScrollbars } from '../../components/CustomScrollbars';
import { useOpenedRoom } from '../../lib/RoomManager';
import { useSideBarRoomsList, sidePanelFiltersConfig } from '../../views/navigation/contexts/RoomsNavigationContext';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';

const RoomList = () => {
	const { t } = useTranslation();
	const isAnonymous = !useUserId();
	const parentRef = useRef<HTMLDivElement>(null);

	const { roomListGroups, groupCounts, collapsedGroups, handleClick, handleKeyDown, totalCount } = useSideBarRoomsList();
	const { ref } = useResizeObserver<HTMLElement>({ debounceDelay: 100 });
	const openedRoom = useOpenedRoom() ?? '';

	const itemData = useMemo(
		() => ({
			t,
			openedRoom,
			isAnonymous,
		}),
		[isAnonymous, openedRoom, t],
	);

	usePreventDefault(ref);
	useShortcutOpenMenu(ref);

	const roomList = roomListGroups.flatMap(({ group, rooms, unreadInfo }) => {
		if (collapsedGroups.includes(group)) {
			return [{ type: 'group', group, unreadInfo }];
		}

		return [{ type: 'group', group, unreadInfo }, ...rooms.map((room) => ({ type: 'room', room }))];
	});

	const rowVirtualizer = useVirtualizer({
		count: roomList.length,
		getScrollElement: () => parentRef.current,
		overscan: 10,
		estimateSize: () => 30,
	});

	return (
		<Box position='relative' overflow='hidden' height='full' ref={ref}>
			<VirtualizedScrollbars ref={parentRef}>
				<>
					<RoomsListFilters />
					<RoomListWrapper>
						<div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
							{rowVirtualizer.getVirtualItems().map((virtualRow) => {
								const item = roomList[virtualRow.index];

								return (
									<RoomListRowWrapper key={virtualRow.key}>
										<div
											key={virtualRow.key}
											ref={rowVirtualizer.measureElement}
											style={{
												position: 'absolute',
												top: 0,
												left: 0,
												width: '100%',
												transform: `translateY(${virtualRow.start}px)`,
											}}
										>
											{item.type === 'group' ? (
												<RoomListCollapser
													collapsedGroups={collapsedGroups}
													onClick={() => handleClick(item.group)}
													onKeyDown={(e) => handleKeyDown(e, item.group)}
													groupTitle={sidePanelFiltersConfig[item.group].title}
													group={item.group}
													unreadCount={item.unreadInfo}
												/>
											) : (
												<RoomListRow data={itemData} item={item.room} />
											)}
										</div>
									</RoomListRowWrapper>
								);
							})}
						</div>
					</RoomListWrapper>
				</>
				{/* </div> */}
			</VirtualizedScrollbars>
		</Box>
	);
};

export default RoomList;
