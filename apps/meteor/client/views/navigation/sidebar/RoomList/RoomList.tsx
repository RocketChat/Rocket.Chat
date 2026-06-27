import { Box } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { VirtualizedScrollbars } from '@rocket.chat/ui-client';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GroupedVirtuoso } from 'react-virtuoso';

import RoomListCollapser from './RoomListCollapser';
import RoomsListFilters from './RoomListFilters';
import RoomListRow from './RoomListRow';
import RoomListRowWrapper from './RoomListRowWrapper';
import RoomListWrapper from './RoomListWrapper';
import { useOpenedRoom } from '../../../../lib/RoomManager';
import { useSideBarRoomsList } from '../../contexts/RoomsNavigationContext';
import { useCustomCategories } from '../../hooks/useCustomCategories';
import { useSystemGroupsOrder } from '../../hooks/useSystemGroupsOrder';
import { CategoryDnDProvider } from '../categories/CategoryDnDContext';
import CategoryEmptyPlaceholder from '../categories/CategoryEmptyPlaceholder';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';

const RoomListInner = () => {
	const { t } = useTranslation();
	const isAnonymous = !useUserId();

	const { roomListGroups, groupCounts, handleClick, handleKeyDown, totalCount } = useSideBarRoomsList();
	const { reorderCategory } = useCustomCategories();
	const { move: moveSystemGroup } = useSystemGroupsOrder();
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

	const customCount = roomListGroups.filter((group) => group.category).length;
	const systemKeys = roomListGroups.filter((group) => !group.category).map((group) => group.key);

	usePreventDefault(ref);
	useShortcutOpenMenu(ref);

	return (
		<Box position='relative' overflow='hidden' height='full' ref={ref}>
			<VirtualizedScrollbars>
				<GroupedVirtuoso
					groupCounts={groupCounts}
					groupContent={(index) => {
						const group = roomListGroups[index];
						const isCustom = Boolean(group.category);
						const positionInSegment = isCustom ? index : index - customCount;
						const segmentLength = isCustom ? customCount : systemKeys.length;

						const onMoveUp = () => (isCustom ? reorderCategory(group.key, 'up') : moveSystemGroup(systemKeys, group.key, 'up'));
						const onMoveDown = () => (isCustom ? reorderCategory(group.key, 'down') : moveSystemGroup(systemKeys, group.key, 'down'));

						return (
							<RoomListCollapser
								group={group}
								canMoveUp={positionInSegment > 0}
								canMoveDown={positionInSegment < segmentLength - 1}
								onMoveUp={onMoveUp}
								onMoveDown={onMoveDown}
								onClick={() => handleClick(group.key)}
								onKeyDown={(e) => handleKeyDown(e, group.key)}
							/>
						);
					}}
					{...(totalCount > 0 && {
						itemContent: (index, groupIndex) => {
							const group = roomListGroups[groupIndex];

							if (group.empty) {
								return <CategoryEmptyPlaceholder categoryId={group.key} />;
							}

							// Grouped virtuoso index increases linearly, but we're indexing the list by group.
							const correctedIndex = index - groupCounts.slice(0, groupIndex).reduce((acc, count) => acc + count, 0);
							return (
								<RoomListRow
									data={itemData}
									item={group.rooms[correctedIndex]}
									groupKey={group.key}
									isCustomCategory={Boolean(group.category)}
								/>
							);
						},
					})}
					components={{ Header: RoomsListFilters, Item: RoomListRowWrapper, List: RoomListWrapper }}
				/>
			</VirtualizedScrollbars>
		</Box>
	);
};

// eslint-disable-next-line react/no-multi-comp
const RoomList = () => (
	<CategoryDnDProvider>
		<RoomListInner />
	</CategoryDnDProvider>
);

export default RoomList;
