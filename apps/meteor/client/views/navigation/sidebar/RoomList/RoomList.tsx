import { Box } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { VirtualizedScrollbars, useMergedRefsV2 } from '@rocket.chat/ui-client';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';
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

	const preventDefaultRef = usePreventDefault();
	const shortcutOpenMenuRef = useShortcutOpenMenu();
	const ref = useMergedRefsV2(resizeObserverRef, preventDefaultRef, shortcutOpenMenuRef);

	const computeItemKey = useCallback(
		(flatIndex: number): string => {
			// GroupedVirtuoso calls computeItemKey with the flat index, which counts
			// group headers as items: the header of group g sits at
			// sum(groupCounts[0..g-1]) + g, followed by that group's rooms.
			// Keying rows by room id instead of the default index keeps React from
			// reusing a row — and any menu open inside it — for a different room
			// when the list shifts, e.g. after a room is marked as read.
			let offset = 0;
			for (let groupIndex = 0; groupIndex < groupCounts.length; groupIndex++) {
				if (flatIndex === offset) {
					return `group-${roomListGroups[groupIndex].group}`;
				}
				const count = groupCounts[groupIndex];
				if (flatIndex < offset + count + 1) {
					return roomListGroups[groupIndex].rooms[flatIndex - offset - 1]._id;
				}
				offset += count + 1;
			}
			return `index-${flatIndex}`;
		},
		[groupCounts, roomListGroups],
	);

	return (
		<Box position='relative' overflow='hidden' height='full' ref={ref}>
			<VirtualizedScrollbars>
				<GroupedVirtuoso
					groupCounts={groupCounts}
					computeItemKey={computeItemKey}
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
