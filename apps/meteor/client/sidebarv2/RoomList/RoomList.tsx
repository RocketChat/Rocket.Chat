import { Box } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserPreference, useUserId } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GroupedVirtuoso } from 'react-virtuoso';

import RoomListCollapser from './RoomListCollapser';
import RoomsListFilters from './RoomListFilters';
import RoomListRow from './RoomListRow';
import RoomListRowWrapper from './RoomListRowWrapper';
import RoomListWrapper from './RoomListWrapper';
import { VirtualizedScrollbars } from '../../components/CustomScrollbars';
import { useOpenedRoom } from '../../lib/RoomManager';
import { useSideBarRoomsList } from '../../views/navigation/contexts/RoomsNavigationContext';
import { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';
import { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';

const RoomList = () => {
	const { t } = useTranslation();
	const isAnonymous = !useUserId();

	const { roomListGroups, groupCounts, collapsedGroups, handleClick, handleKeyDown, totalCount } = useSideBarRoomsList();
	const avatarTemplate = useAvatarTemplate('condensed');
	const sideBarItemTemplate = useTemplateByViewMode('condensed');
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
		}),
		[avatarTemplate, extended, isAnonymous, openedRoom, sideBarItemTemplate, sidebarViewMode, t],
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
								groupTitle={group}
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
							// TODO: ILivechatInquiryRecord
							return rooms[correctedIndex] && <RoomListRow data={itemData} item={rooms[correctedIndex] as SubscriptionWithRoom} />;
						},
					})}
					components={{ Header: RoomsListFilters, Item: RoomListRowWrapper, List: RoomListWrapper }}
				/>
			</VirtualizedScrollbars>
		</Box>
	);
};

export default RoomList;
