import { Box } from '@rocket.chat/fuselage';
import { useUserPreference, useUserId } from '@rocket.chat/ui-contexts';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { VirtualizerHandle } from 'virtua';

import MoreUnreadsBubble from './MoreUnreadsBubble';
import RoomListCollapser from './RoomListCollapser';
import RoomListRow from './RoomListRow';
import RoomListRowWrapper from './RoomListRowWrapper';
import RoomListWrapper from './RoomListWrapper';
import { useMergedRefsV2 } from '../../hooks/useMergedRefsV2';
import { useOpenedRoom } from '../../lib/RoomManager';
import { useMoveCategoryPosition } from '../categories/hooks/useMoveCategoryPosition';
import SidebarVirtualList from '../components/SidebarVirtualList';
import { SIDEBAR_DYNAMIC_GROUP_KEYS } from '../hooks/useCategoryList';
import { useCollapsedGroups } from '../hooks/useCollapsedGroups';
import { useOffscreenUnreads } from '../hooks/useOffscreenUnreads';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useRoomList } from '../hooks/useRoomList';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';

const canMoveGroup = (groups: { key: string }[], index: number, direction: 'up' | 'down'): boolean => {
	if (SIDEBAR_DYNAMIC_GROUP_KEYS.includes(groups[index].key)) return false;
	if (direction === 'down') return index + 1 < groups.length;
	return groups.slice(0, index).some((g) => !SIDEBAR_DYNAMIC_GROUP_KEYS.includes(g.key));
};

type SidebarViewMode = 'extended' | 'medium' | 'condensed';

const sidebarRowHeight: Record<SidebarViewMode, number> = {
	condensed: 28,
	medium: 36,
	extended: 48,
};

const SIDEBAR_VIRTUAL_BUFFER_ROWS = 5;

type RoomListProps = {
	/** Narrows the list to the rooms whose name matches, as the Inbox search does. */
	filterText?: string;
};

const RoomList = ({ filterText = '' }: RoomListProps) => {
	const { t } = useTranslation();
	const userId = useUserId();
	const isAnonymous = !userId;

	const { collapsedGroups, handleClick } = useCollapsedGroups();
	const { groups } = useRoomList({ collapsedGroups, filterText });
	// While filtering, groups show expanded and some are left out, so collapsing or moving them is turned off.
	const filtering = Boolean(filterText.trim());
	const moveCategory = useMoveCategoryPosition();
	const virtualizerRef = useRef<VirtualizerHandle>(null);
	const { previousUnread, nextUnread, handleRangeChange } = useOffscreenUnreads({ groups });
	const openedRoom = useOpenedRoom() ?? '';
	const sidebarViewMode = useUserPreference<SidebarViewMode>('sidebarViewMode') || 'extended';
	const sidebarDisplayAvatar = !!useUserPreference<boolean>('sidebarDisplayAvatar');
	const bufferSize = sidebarRowHeight[sidebarViewMode] * SIDEBAR_VIRTUAL_BUFFER_ROWS;

	const itemData = useMemo(
		() => ({
			t,
			viewMode: sidebarViewMode,
			showAvatar: sidebarDisplayAvatar,
			openedRoom,
			isAnonymous,
			userId,
		}),
		[isAnonymous, openedRoom, sidebarDisplayAvatar, sidebarViewMode, t, userId],
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

	const scrollToUnread = (index: number) => {
		virtualizerRef.current?.scrollToIndex(index, { align: 'center', smooth: true });
	};

	const preventDefaultRef = usePreventDefault();
	const shortcutOpenMenuRef = useShortcutOpenMenu();
	const ref = useMergedRefsV2(preventDefaultRef, shortcutOpenMenuRef);

	if (filtering && groups.length === 0) {
		return (
			<Box paddingInline={16} paddingBlock={8} fontScale='p2' color='hint' role='status'>
				{t('No_results_found')}
			</Box>
		);
	}

	return (
		<Box position='relative' overflow='hidden' height='full' ref={ref}>
			<SidebarVirtualList
				ref={virtualizerRef}
				groups={virtualGroups}
				as={RoomListWrapper}
				bufferSize={bufferSize}
				onRangeChange={handleRangeChange}
				getItemKey={(item) => item._id}
				renderGroup={(group, index) => (
					<RoomListCollapser
						group={group}
						canMoveUp={!filtering && canMoveGroup(groups, index, 'up')}
						canMoveDown={!filtering && canMoveGroup(groups, index, 'down')}
						onMoveUp={() => moveCategory(allGroupKeys, group.key, 'up')}
						onMoveDown={() => moveCategory(allGroupKeys, group.key, 'down')}
						onClick={() => !filtering && handleClick(group.key)}
					/>
				)}
				renderItem={(item, _itemIndex, _group, _groupIndex, rowIndex) => (
					<RoomListRowWrapper data-index={rowIndex}>
						<RoomListRow data={itemData} item={item} />
					</RoomListRowWrapper>
				)}
			/>
			{previousUnread && (
				<MoreUnreadsBubble direction='up' mention={previousUnread.mention} onClick={() => scrollToUnread(previousUnread.index)} />
			)}
			{nextUnread && <MoreUnreadsBubble direction='down' mention={nextUnread.mention} onClick={() => scrollToUnread(nextUnread.index)} />}
		</Box>
	);
};

export default RoomList;
