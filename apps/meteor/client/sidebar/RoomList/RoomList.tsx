import { Box } from '@rocket.chat/fuselage';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import RoomListCollapser from './RoomListCollapser';
import RoomListRow from './RoomListRow';
import RoomListRowWrapper from './RoomListRowWrapper';
import RoomListWrapper from './RoomListWrapper';
import { useMergedRefsV2 } from '../../hooks/useMergedRefsV2';
import { useOpenedRoom } from '../../lib/RoomManager';
import { useMoveCategoryPosition } from '../categories/hooks/useMoveCategoryPosition';
import SidebarVirtualList from '../components/SidebarVirtualList';
import { useCollapsedGroups } from '../hooks/useCollapsedGroups';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useRoomList } from '../hooks/useRoomList';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';
import { useSidebarPresentation } from '../hooks/useSidebarPresentation';
import { canMoveGroup } from '../lib/reorderableGroups';

const SIDEBAR_VIRTUAL_BUFFER_ROWS = 5;

const RoomList = () => {
	const { t } = useTranslation();
	const userId = useUserId();
	const isAnonymous = !userId;

	const { collapsedGroups, handleClick, handleKeyDown } = useCollapsedGroups();
	const { groups } = useRoomList({ collapsedGroups });
	const moveCategory = useMoveCategoryPosition();
	const openedRoom = useOpenedRoom() ?? '';
	const {
		viewMode: sidebarViewMode,
		extended,
		rowHeight,
		ItemTemplate: sideBarItemTemplate,
		AvatarTemplate: avatarTemplate,
	} = useSidebarPresentation();
	const bufferSize = rowHeight * SIDEBAR_VIRTUAL_BUFFER_ROWS;
	const itemData = useMemo(
		() => ({
			extended,
			t,
			SidebarItemTemplate: sideBarItemTemplate,
			AvatarTemplate: avatarTemplate,
			openedRoom,
			sidebarViewMode,
			isAnonymous,
			userId,
		}),
		[avatarTemplate, extended, isAnonymous, openedRoom, sideBarItemTemplate, sidebarViewMode, t, userId],
	);

	const allGroupKeys = useMemo(() => groups.map((group) => group.key), [groups]);

	const virtualGroups = useMemo(
		() =>
			groups.map((group) => ({
				key: group.key,
				group,
				items: group.rooms,
			})),
		[groups],
	);

	const preventDefaultRef = usePreventDefault();
	const shortcutOpenMenuRef = useShortcutOpenMenu();
	const ref = useMergedRefsV2(preventDefaultRef, shortcutOpenMenuRef);

	return (
		<Box position='relative' overflow='hidden' height='full' ref={ref}>
			<SidebarVirtualList
				groups={virtualGroups}
				as={RoomListWrapper}
				bufferSize={bufferSize}
				getItemKey={(item) => item._id}
				renderGroup={(group, index) => (
					<RoomListCollapser
						group={group}
						canMoveUp={canMoveGroup(groups, index, 'up')}
						canMoveDown={canMoveGroup(groups, index, 'down')}
						onMoveUp={() => moveCategory(allGroupKeys, group.key, 'up')}
						onMoveDown={() => moveCategory(allGroupKeys, group.key, 'down')}
						onClick={() => handleClick(group.key)}
						onKeyDown={(e) => handleKeyDown(e, group.key)}
					/>
				)}
				renderItem={(item, _itemIndex, _group, _groupIndex, rowIndex) => (
					<RoomListRowWrapper data-index={rowIndex}>
						<RoomListRow data={itemData} item={item} />
					</RoomListRowWrapper>
				)}
			/>
		</Box>
	);
};

export default RoomList;
