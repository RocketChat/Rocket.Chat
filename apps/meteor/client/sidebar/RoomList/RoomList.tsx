import { Box } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { VirtualizedScrollbars } from '@rocket.chat/ui-client';
import { useUserPreference, useUserId } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GroupedVirtuoso } from 'react-virtuoso';

import RoomListCollapser from './RoomListCollapser';
import RoomListRow from './RoomListRow';
import RoomListRowWrapper from './RoomListRowWrapper';
import RoomListWrapper from './RoomListWrapper';
import { useOpenedRoom } from '../../lib/RoomManager';
import { useMoveCategoryPosition } from '../categories/hooks/useMoveCategoryPosition';
import { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { SIDEBAR_DYNAMIC_GROUP_KEYS } from '../hooks/useCategoryList';
import { useCollapsedGroups } from '../hooks/useCollapsedGroups';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useRoomList } from '../hooks/useRoomList';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';
import { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';

const canMoveGroup = (groups: { key: string }[], index: number, direction: 'up' | 'down'): boolean => {
	if (SIDEBAR_DYNAMIC_GROUP_KEYS.includes(groups[index].key)) return false;
	if (direction === 'down') return index + 1 < groups.length;
	return groups.slice(0, index).some((g) => !SIDEBAR_DYNAMIC_GROUP_KEYS.includes(g.key));
};

const RoomList = () => {
	const { t } = useTranslation();
	const userId = useUserId();
	const isAnonymous = !userId;

	const { collapsedGroups, handleClick, handleKeyDown } = useCollapsedGroups();
	const { groupsCount, groupsList, roomList, groupedUnreadInfo } = useRoomList({ collapsedGroups });
	const avatarTemplate = useAvatarTemplate();
	const sideBarItemTemplate = useTemplateByViewMode();
	const { ref } = useResizeObserver<HTMLElement>({ debounceDelay: 100 });
	const openedRoom = useOpenedRoom() ?? '';
	const sidebarViewMode = useUserPreference<'extended' | 'medium' | 'condensed'>('sidebarViewMode') || 'extended';

	const extended = sidebarViewMode === 'extended';
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

	usePreventDefault(ref);
	useShortcutOpenMenu(ref);

	return (
		<Box position='relative' overflow='hidden' height='full' ref={ref}>
			<VirtualizedScrollbars>
				<GroupedVirtuoso
					groupCounts={groupsCount}
					groupContent={(index) => (
						<RoomListCollapser
							collapsedGroups={collapsedGroups}
							onClick={() => handleClick(groupsList[index])}
							onKeyDown={(e) => handleKeyDown(e, groupsList[index])}
							groupTitle={groupsList[index]}
							unreadCount={groupedUnreadInfo[index]}
						/>
					)}
					{...(roomList.length > 0 && {
						itemContent: (index) => roomList[index] && <RoomListRow data={itemData} item={roomList[index]} />,
					})}
					components={{ Item: RoomListRowWrapper, List: RoomListWrapper }}
				/>
			</VirtualizedScrollbars>
		</Box>
	);
};

export default RoomList;
