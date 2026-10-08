import { Box, Button } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import FilterGroupHeader from './FilterGroupHeader';
import FiltersListWrapper from './FiltersListWrapper';
import SidebarRailFiltersEmpty from './SidebarRailFiltersEmpty';
import type { FilterGroup } from './hooks/useFilterGroups';
import { useFilterGroups } from './hooks/useFilterGroups';
import { useFilterModals } from './hooks/useFilterModals';
import { useReorderFilters } from './hooks/useFilterMutations';
import { useSidebarFiltersDisplay } from './hooks/useSidebarFiltersPreferences';
import { hasRules } from './lib/evaluateFilter';
import { useMergedRefsV2 } from '../../../hooks/useMergedRefsV2';
import { useOpenedRoom } from '../../../lib/RoomManager';
import RoomListRow from '../../RoomList/RoomListRow';
import RoomListRowWrapper from '../../RoomList/RoomListRowWrapper';
import SidebarVirtualList from '../../components/SidebarVirtualList';
import { useAvatarTemplate } from '../../hooks/useAvatarTemplate';
import { useCollapsedGroups } from '../../hooks/useCollapsedGroups';
import { usePreventDefault } from '../../hooks/usePreventDefault';
import { useShortcutOpenMenu } from '../../hooks/useShortcutOpenMenu';
import { useTemplateByViewMode } from '../../hooks/useTemplateByViewMode';

const sidebarRowHeight = {
	condensed: 28,
	medium: 36,
	extended: 48,
} as const;

const SIDEBAR_VIRTUAL_BUFFER_ROWS = 5;

type EmptyItem = { kind: 'empty' };

type FilterListItem = SubscriptionWithRoom | EmptyItem;

const isEmptyItem = (item: FilterListItem): item is EmptyItem => 'kind' in item && item.kind === 'empty';

const emptyItems: FilterListItem[] = [{ kind: 'empty' }];

const SidebarRailFiltersList = () => {
	const { t } = useTranslation();
	const userId = useUserId();
	const isAnonymous = !userId;

	const { viewMode, displayAvatar } = useSidebarFiltersDisplay();
	const { collapsedGroups, handleClick, handleKeyDown } = useCollapsedGroups('sidebarFiltersCollapsed');
	const groups = useFilterGroups(collapsedGroups);
	const { mutate: reorderFilters } = useReorderFilters();
	const { openEditFilter } = useFilterModals();

	const avatarTemplate = useAvatarTemplate(viewMode, displayAvatar);
	const sideBarItemTemplate = useTemplateByViewMode(viewMode);
	const openedRoom = useOpenedRoom() ?? '';
	const bufferSize = sidebarRowHeight[viewMode] * SIDEBAR_VIRTUAL_BUFFER_ROWS;

	const itemData = useMemo(
		() => ({
			extended: viewMode === 'extended',
			t,
			SidebarItemTemplate: sideBarItemTemplate,
			AvatarTemplate: avatarTemplate,
			openedRoom,
			sidebarViewMode: viewMode,
			isAnonymous,
			userId,
		}),
		[avatarTemplate, isAnonymous, openedRoom, sideBarItemTemplate, t, userId, viewMode],
	);

	const virtualGroups = useMemo(
		() =>
			groups.map((group) => {
				const items: readonly FilterListItem[] = group.rooms.length > 0 ? group.rooms : emptyItems;

				return { key: group.filter._id, group, items: group.collapsed ? [] : items };
			}),
		[groups],
	);

	const moveFilter = (index: number, offset: -1 | 1) => {
		const filterIds = groups.map(({ filter }) => filter._id);
		[filterIds[index], filterIds[index + offset]] = [filterIds[index + offset], filterIds[index]];
		reorderFilters({ filterIds });
	};

	const preventDefaultRef = usePreventDefault();
	const shortcutOpenMenuRef = useShortcutOpenMenu();
	const ref = useMergedRefsV2(preventDefaultRef, shortcutOpenMenuRef);

	if (groups.length === 0) {
		return <SidebarRailFiltersEmpty />;
	}

	const renderEmpty = ({ filter }: FilterGroup) => {
		if (filter.needsReview || !hasRules(filter)) {
			return (
				<Box display='flex' alignItems='center' justifyContent='space-between' paddingInline={16} paddingBlock={4}>
					<Box fontScale='c1' color='font-secondary-info'>
						{t('Filter_has_no_rules')}
					</Box>
					<Button small secondary onClick={() => openEditFilter(filter)}>
						{t('Edit')}
					</Button>
				</Box>
			);
		}

		return (
			<Box fontScale='c1' color='font-secondary-info' paddingInline={16} paddingBlock={4}>
				{t('No_rooms')}
			</Box>
		);
	};

	return (
		<Box position='relative' overflow='hidden' height='full' flexGrow={1} ref={ref}>
			<SidebarVirtualList<FilterGroup, FilterListItem>
				groups={virtualGroups}
				as={FiltersListWrapper}
				bufferSize={bufferSize}
				getItemKey={(item, _itemIndex, group) => `${group.filter._id}:${isEmptyItem(item) ? 'empty' : item.rid}`}
				renderGroup={(group, index) => (
					<FilterGroupHeader
						group={group}
						canMoveUp={index > 0}
						canMoveDown={index < groups.length - 1}
						onMoveUp={() => moveFilter(index, -1)}
						onMoveDown={() => moveFilter(index, 1)}
						onClick={() => handleClick(group.filter._id)}
						onKeyDown={(e) => handleKeyDown(e, group.filter._id)}
					/>
				)}
				renderItem={(item, _itemIndex, group, _groupIndex, rowIndex) =>
					isEmptyItem(item) ? (
						renderEmpty(group)
					) : (
						<RoomListRowWrapper data-index={rowIndex}>
							<RoomListRow data={itemData} item={item} />
						</RoomListRowWrapper>
					)
				}
			/>
		</Box>
	);
};

export default SidebarRailFiltersList;
