import { Box } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import RoomListCollapser from './RoomListCollapser';
import RoomListRow from './RoomListRow';
import RoomListRowWrapper from './RoomListRowWrapper';
import RoomListWrapper from './RoomListWrapper';
import { useMergedRefsV2 } from '../../hooks/useMergedRefsV2';
import { itemTemplateByViewMode, roomAvatarForViewMode } from '../Item/templates';
import SidebarVirtualList from '../components/SidebarVirtualList';
import {
	useRoomListActions,
	useRoomListCollapse,
	useRoomListGroups,
	useRoomListPresentation,
	useRoomListRingingCalls,
	useRoomListViewer,
} from '../contexts/RoomListContext';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';
import { canMoveGroup } from '../lib/reorderableGroups';

const SIDEBAR_VIRTUAL_BUFFER_ROWS = 5;

const RoomList = () => {
	const { t } = useTranslation();

	const groups = useRoomListGroups();
	const { toggle: handleClick, onKeyDown: handleKeyDown } = useRoomListCollapse();
	const { moveCategory } = useRoomListActions();
	const ringingCalls = useRoomListRingingCalls();
	const { userId, isAnonymous, openedRoom, isPriorityEnabled, canCustomiseGroups, formatTime } = useRoomListViewer();
	const { viewMode: sidebarViewMode, extended, showAvatar, rowHeight } = useRoomListPresentation();
	const sideBarItemTemplate = itemTemplateByViewMode[sidebarViewMode];
	const avatarTemplate = useMemo(() => (showAvatar ? roomAvatarForViewMode(sidebarViewMode) : null), [showAvatar, sidebarViewMode]);
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
			formatTime,
			isPriorityEnabled,
		}),
		[avatarTemplate, extended, formatTime, isAnonymous, isPriorityEnabled, openedRoom, sideBarItemTemplate, sidebarViewMode, t, userId],
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
						canCustomiseGroups={canCustomiseGroups}
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
						<RoomListRow data={itemData} item={item} videoConfActions={ringingCalls.get(item.rid)} />
					</RoomListRowWrapper>
				)}
			/>
		</Box>
	);
};

export default RoomList;
