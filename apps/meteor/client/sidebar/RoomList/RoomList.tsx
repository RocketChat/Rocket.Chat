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
import SidebarFilterEmptyState from './SidebarFilterEmptyState';
import SidebarFilterTags from './SidebarFilterTags';
import { useOpenedRoom } from '../../lib/RoomManager';
import { useCustomCategories } from '../../views/navigation/hooks/useCustomCategories';
import { useSystemGroupsOrder } from '../../views/navigation/hooks/useSystemGroupsOrder';
import { CategoryDnDProvider } from '../../views/navigation/sidebar/categories/CategoryDnDContext';
import CategoryDropHighlight from '../../views/navigation/sidebar/categories/CategoryDropHighlight';
import CategoryEmptyPlaceholder from '../../views/navigation/sidebar/categories/CategoryEmptyPlaceholder';
import { RoomListFilterProvider, useRoomListFilter } from '../contexts/RoomListFilterContext';
import { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { useCollapsedGroups } from '../hooks/useCollapsedGroups';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useRoomList } from '../hooks/useRoomList';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';
import { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';
import { normalizeSidebarViewMode } from '../lib/normalizeSidebarViewMode';

const RoomListInner = () => {
	const { t } = useTranslation();
	const userId = useUserId();
	const isAnonymous = !userId;

	const { collapsedGroups, handleClick, handleKeyDown } = useCollapsedGroups();
	const { filter } = useRoomListFilter();
	const { groups, groupsCount, totalCount } = useRoomList({ collapsedGroups, filter });
	const { reorderCategory } = useCustomCategories();
	const { move: moveSystemGroup } = useSystemGroupsOrder();
	const avatarTemplate = useAvatarTemplate();
	const sideBarItemTemplate = useTemplateByViewMode();
	const { ref } = useResizeObserver<HTMLElement>({ debounceDelay: 100 });
	const openedRoom = useOpenedRoom() ?? '';
	const sidebarViewMode = normalizeSidebarViewMode(useUserPreference<'extended' | 'medium' | 'condensed'>('sidebarViewMode')) || 'extended';

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

	const customCount = groups.filter((group) => group.category).length;
	const systemKeys = groups.filter((group) => !group.category).map((group) => group.key);

	usePreventDefault(ref);
	useShortcutOpenMenu(ref);

	return (
		<Box display='flex' flexDirection='column' height='full'>
			<SidebarFilterTags />
			{/* `isolation: isolate` makes this an own stacking context so the drag-over highlight (z-index -1) sits
			   behind the rows but above the sidebar surface. `minHeight: 0` lets this flex child scroll. */}
			<Box position='relative' overflow='hidden' flexGrow={1} flexShrink={1} ref={ref} style={{ isolation: 'isolate', minHeight: 0 }}>
				<CategoryDropHighlight containerRef={ref} />
				{filter !== 'all' && totalCount === 0 ? (
					<SidebarFilterEmptyState filter={filter} />
				) : (
					<VirtualizedScrollbars>
						<GroupedVirtuoso
							groupCounts={groupsCount}
							groupContent={(index) => {
								const group = groups[index];
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
									const group = groups[groupIndex];

									if (group.empty) {
										return <CategoryEmptyPlaceholder categoryId={group.key} isCustom={Boolean(group.category)} />;
									}

									const correctedIndex = index - groupsCount.slice(0, groupIndex).reduce((acc, count) => acc + count, 0);
									const item = group.rooms[correctedIndex];
									return (
										item && <RoomListRow data={itemData} item={item} groupKey={group.key} isCustomCategory={Boolean(group.category)} />
									);
								},
							})}
							components={{ Item: RoomListRowWrapper, List: RoomListWrapper }}
						/>
					</VirtualizedScrollbars>
				)}
			</Box>
		</Box>
	);
};

// eslint-disable-next-line react/no-multi-comp
const RoomList = () => (
	<RoomListFilterProvider>
		<CategoryDnDProvider>
			<RoomListInner />
		</CategoryDnDProvider>
	</RoomListFilterProvider>
);

export default RoomList;
