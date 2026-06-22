import { Box } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserPreference, useUserId } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import RoomListCollapser from './RoomListCollapser';
import RoomListRow from './RoomListRow';
import RoomListRowWrapper from './RoomListRowWrapper';
import RoomListWrapper from './RoomListWrapper';
import { useOpenedRoom } from '../../lib/RoomManager';
import { useMoveCategoryPosition } from '../categories/hooks/useMoveCategoryPosition';
import SidebarVirtualList from '../components/SidebarVirtualList';
import { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { SIDEBAR_DYNAMIC_GROUP_KEYS } from '../hooks/useCategoryList';
import { useCollapsedGroups } from '../hooks/useCollapsedGroups';
import { usePreventDefault } from '../hooks/usePreventDefault';
import type { SidebarRoomListGroup } from '../hooks/useRoomList';
import { useRoomList } from '../hooks/useRoomList';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';
import { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';

const canMoveGroup = (groups: { key: string }[], index: number, direction: 'up' | 'down'): boolean => {
	if (SIDEBAR_DYNAMIC_GROUP_KEYS.includes(groups[index].key)) return false;
	if (direction === 'down') return index + 1 < groups.length;
	return groups.slice(0, index).some((g) => !SIDEBAR_DYNAMIC_GROUP_KEYS.includes(g.key));
};

const getItemKey = (item: SubscriptionWithRoom) => item._id;

const RoomList = () => {
	const { t } = useTranslation();
	const userId = useUserId();
	const isAnonymous = !userId;

	const { collapsedGroups, handleClick, handleKeyDown } = useCollapsedGroups();
	const { groups } = useRoomList({ collapsedGroups });
	const moveCategory = useMoveCategoryPosition();
	const avatarTemplate = useAvatarTemplate();
	const sideBarItemTemplate = useTemplateByViewMode();
	const ref = useRef<HTMLElement | null>(null);
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

	const virtualGroups = useMemo(
		() =>
			groups.map((group) => ({
				key: group.key,
				group,
				items: group.rooms,
			})),
		[groups],
	);

	const renderGroup = useCallback(
		(group: SidebarRoomListGroup, index: number) => (
			<RoomListCollapser
				group={group}
				canMoveUp={canMoveGroup(groups, index, 'up')}
				canMoveDown={canMoveGroup(groups, index, 'down')}
				onMoveUp={() => moveCategory(allGroupKeys, group.key, 'up')}
				onMoveDown={() => moveCategory(allGroupKeys, group.key, 'down')}
				onClick={() => handleClick(group.key)}
				onKeyDown={(e) => handleKeyDown(e, group.key)}
			/>
		),
		[allGroupKeys, groups, handleClick, handleKeyDown, moveCategory],
	);

	const renderItem = useCallback(
		(item: SubscriptionWithRoom) => (
			<RoomListRowWrapper>
				<RoomListRow data={itemData} item={item} />
			</RoomListRowWrapper>
		),
		[itemData],
	);

	usePreventDefault(ref);
	useShortcutOpenMenu(ref);

	return (
		<Box position='relative' overflow='hidden' height='full' ref={ref}>
			<SidebarVirtualList
				groups={virtualGroups}
				as={RoomListWrapper}
				overscan={25}
				getItemKey={getItemKey}
				renderGroup={renderGroup}
				renderItem={renderItem}
			/>
		</Box>
	);
};

export default RoomList;
