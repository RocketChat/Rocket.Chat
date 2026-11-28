import { Box } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { VirtualizedScrollbars, useMergedRefsV2 } from '@rocket.chat/ui-client';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GroupedVirtuoso } from 'react-virtuoso';

import RoomListCollapser from './RoomListCollapser';
import RoomsListFilters from './RoomListFilters';
import RoomListGroupWrapper from './RoomListGroupWrapper';
import RoomListRow from './RoomListRow';
import RoomListRowWrapper from './RoomListRowWrapper';
import RoomListWrapper from './RoomListWrapper';
import { useSideBarRoomsList, sidePanelFiltersConfig } from '../../contexts/RoomsNavigationContext';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';

const RoomList = () => {
	const { t } = useTranslation();
	const isAnonymous = !useUserId();

	const { roomListGroups, groupCounts, collapsedGroups, handleClick, totalCount } = useSideBarRoomsList();
	const { ref: resizeObserverRef } = useResizeObserver<HTMLElement>({ debounceDelay: 100 });

	const itemData = useMemo(
		() => ({
			t,
			isAnonymous,
		}),
		[isAnonymous, t],
	);

	const flatItems = useMemo(
		() =>
			roomListGroups.flatMap(({ group, rooms }) => [
				{ type: 'header' as const, key: `header-${group}` },
				...(collapsedGroups.includes(group) ? [] : rooms.map((room) => ({ type: 'room' as const, group, room }))),
			]),
		[roomListGroups, collapsedGroups],
	);

	const preventDefaultRef = usePreventDefault();
	const shortcutOpenMenuRef = useShortcutOpenMenu();
	const ref = useMergedRefsV2(resizeObserverRef, preventDefaultRef, shortcutOpenMenuRef);

	return (
		<Box position='relative' overflow='hidden' height='full' ref={ref}>
			<VirtualizedScrollbars>
				<GroupedVirtuoso
					groupCounts={groupCounts}
					groupContent={(index) => {
						const { group, unreadInfo } = roomListGroups[index];

						return (
							<RoomListCollapser
								collapsedGroups={collapsedGroups}
								onClick={() => handleClick(group)}
								groupTitle={sidePanelFiltersConfig[group].title}
								group={group}
								unreadCount={unreadInfo}
							/>
						);
					}}
					computeItemKey={(index) => {
						const item = flatItems[index];
						if (!item) {
							return index;
						}
						if (item.type === 'header') {
							return item.key;
						}
						return `${item.group}-${item.room._id || item.room.rid || index}`;
					}}
					{...(totalCount > 0 && {
						itemContent: (index, groupIndex) => {
							const { rooms } = roomListGroups[groupIndex];
							// Grouped virtuoso index increases linearly, but we're indexing the list by group.
							// Either we go back to providing a single list, or we do this.
							const correctedIndex = index - groupCounts.slice(0, groupIndex).reduce((acc, count) => acc + count, 0);
							return <RoomListRow data={itemData} item={rooms[correctedIndex]} />;
						},
					})}
					components={{ Header: RoomsListFilters, Item: RoomListRowWrapper, List: RoomListWrapper, Group: RoomListGroupWrapper }}
				/>
			</VirtualizedScrollbars>
		</Box>
	);
};

export default RoomList;
