import { Box } from '@rocket.chat/fuselage';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import RoomListCollapser from './RoomListCollapser';
import RoomListRow from './RoomListRow';
import RoomListRowWrapper from './RoomListRowWrapper';
import RoomListWrapper from './RoomListWrapper';
import { useMergedRefsV2 } from '../../hooks/useMergedRefsV2';
import { useOpenedRoom } from '../../lib/RoomManager';
import { getSidebarItemGap, getSidebarItemHeight } from '../Item/sidebarItemLayout';
import { useMoveCategoryPosition } from '../categories/hooks/useMoveCategoryPosition';
import { useUserSidebarCategories } from '../categories/hooks/useUserSidebarCategories';
import SidebarVirtualList from '../components/SidebarVirtualList';
import { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { SIDEBAR_DYNAMIC_GROUP_KEYS } from '../hooks/useCategoryList';
import { useCollapsedGroups } from '../hooks/useCollapsedGroups';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useRoomList } from '../hooks/useRoomList';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';
import { useSidebarDisplayPreferences } from '../hooks/useSidebarDisplayPreferences';

const canMoveGroup = (groups: { key: string }[], index: number, direction: 'up' | 'down'): boolean => {
	if (SIDEBAR_DYNAMIC_GROUP_KEYS.includes(groups[index].key)) return false;
	if (direction === 'down') return index + 1 < groups.length;
	return groups.slice(0, index).some((g) => !SIDEBAR_DYNAMIC_GROUP_KEYS.includes(g.key));
};

const SIDEBAR_VIRTUAL_BUFFER_ROWS = 5;

const RoomList = () => {
	const { t } = useTranslation();
	const userId = useUserId();
	const isAnonymous = !userId;

	const { collapsedGroups, handleClick, handleKeyDown } = useCollapsedGroups();
	// Lifting a group's activity filter from its chip lasts for this session only, and only for the window it was
	// lifted from: picking another window filters the group again.
	const { rawCategories } = useUserSidebarCategories();
	const getActivityFilterHours = useCallback(
		(key: string) => rawCategories.find((entry) => entry._id === key)?.activityFilterHours,
		[rawCategories],
	);
	const [liftedActivityFilters, setLiftedActivityFilters] = useState<Record<string, number | undefined>>({});
	const groupsShowingInactive = useMemo(
		() =>
			Object.entries(liftedActivityFilters)
				.filter(([key, hours]) => hours === getActivityFilterHours(key))
				.map(([key]) => key),
		[liftedActivityFilters, getActivityFilterHours],
	);
	const toggleShowingInactive = useCallback(
		(key: string) =>
			setLiftedActivityFilters(({ [key]: _, ...lifted }) =>
				groupsShowingInactive.includes(key) ? lifted : { ...lifted, [key]: getActivityFilterHours(key) },
			),
		[groupsShowingInactive, getActivityFilterHours],
	);
	const { groups } = useRoomList({ collapsedGroups, groupsShowingInactive });
	const moveCategory = useMoveCategoryPosition();
	const avatarTemplate = useAvatarTemplate();
	const openedRoom = useOpenedRoom() ?? '';
	const { viewMode, displayPreview, displayAvatar, avatarSize: preferredAvatarSize } = useSidebarDisplayPreferences();
	const avatarSize = displayAvatar ? preferredAvatarSize : undefined;
	const itemGap = getSidebarItemGap(viewMode);
	const rowWrapperStyle = useMemo(() => ({ paddingBlock: itemGap / 2 }), [itemGap]);
	const bufferSize = (getSidebarItemHeight(viewMode, displayPreview, avatarSize) + itemGap) * SIDEBAR_VIRTUAL_BUFFER_ROWS;

	const itemData = useMemo(
		() => ({
			t,
			AvatarTemplate: avatarTemplate,
			openedRoom,
			viewMode,
			avatarSize,
			displayPreview,
			isAnonymous,
			userId,
		}),
		[avatarTemplate, avatarSize, displayPreview, isAnonymous, openedRoom, viewMode, t, userId],
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
						onToggleInactive={() => toggleShowingInactive(group.key)}
						onClick={() => handleClick(group.key)}
						onKeyDown={(e) => handleKeyDown(e, group.key)}
					/>
				)}
				renderItem={(item, _itemIndex, _group, _groupIndex, rowIndex) => (
					<RoomListRowWrapper data-index={rowIndex} style={rowWrapperStyle}>
						<RoomListRow data={itemData} item={item} />
					</RoomListRowWrapper>
				)}
			/>
		</Box>
	);
};

export default RoomList;
