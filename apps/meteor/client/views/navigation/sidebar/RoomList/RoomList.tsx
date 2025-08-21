import { Box } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GroupedVirtuoso } from 'react-virtuoso';

import RoomListCollapser from './RoomListCollapser';
import RoomsListFilters from './RoomListFilters';
import RoomListRow from './RoomListRow';
import RoomListRowWrapper from './RoomListRowWrapper';
import RoomListWrapper from './RoomListWrapper';
import { VirtualizedScrollbars } from '../../../../components/CustomScrollbars';
import { useOpenedRoom } from '../../../../lib/RoomManager';
import { useSideBarRoomsList, sidePanelFiltersConfig } from '../../contexts/RoomsNavigationContext';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';

const RoomList = () => {
	const { t } = useTranslation();
	const isAnonymous = !useUserId();

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
								onKeyDown={(e) => handleKeyDown(e, group)}
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
					components={{ Header: RoomsListFilters, Item: RoomListRowWrapper, List: RoomListWrapper }}
				/>
			</VirtualizedScrollbars>
		</Box>
	);
};

export default RoomList;
