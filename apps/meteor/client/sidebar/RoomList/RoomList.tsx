/* eslint-disable react/no-multi-comp */
import type { ISubscription, IRoom } from '@rocket.chat/core-typings';
import { Box, SidebarV2GroupTitle } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useUserPreference, useUserId, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';
import { GroupedVirtuoso } from 'react-virtuoso';

import { VirtuosoScrollbars } from '../../components/CustomScrollbars';
import { useOpenedRoom } from '../../lib/RoomManager';
import { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useRoomList } from '../hooks/useRoomList';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';
import { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';
import RoomListRow from './RoomListRow';
import RoomListRowWrapper from './RoomListRowWrapper';
import RoomListWrapper from './RoomListWrapper';

const getRoomsByGroup = (rooms: (ISubscription & IRoom)[]) => {
	const groupCounts = rooms
		.reduce((acc, item, index) => {
			if (typeof item === 'string') {
				acc.push(index);
			}
			return acc;
		}, [] as number[])
		.map((item, index, arr) => (arr[index + 1] ? arr[index + 1] : rooms.length) - item - 1);

	const groupList = rooms.filter((item) => typeof item === 'string') as unknown as TranslationKey[];
	const roomList = rooms.filter((item) => typeof item !== 'string');

	return {
		groupCounts,
		groupList,
		roomList,
	};
};

const RoomList = () => {
	const t = useTranslation();
	const isAnonymous = !useUserId();
	const roomsList = useRoomList();
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
		}),
		[avatarTemplate, extended, isAnonymous, openedRoom, sideBarItemTemplate, sidebarViewMode, t],
	);

	usePreventDefault(ref);
	useShortcutOpenMenu(ref);

	const { groupCounts, groupList, roomList } = getRoomsByGroup(roomsList);

	return (
		<Box position='relative' display='flex' overflow='hidden' height='full' flexGrow={1} flexShrink={1} flexBasis='auto' ref={ref}>
			<GroupedVirtuoso
				groupCounts={groupCounts}
				groupContent={(index) => <SidebarV2GroupTitle title={t(groupList[index])} />}
				itemContent={(index) => <RoomListRow data={itemData} item={roomList[index]} />}
				components={{ Item: RoomListRowWrapper, List: RoomListWrapper, Scroller: VirtuosoScrollbars }}
			/>
		</Box>
	);
};

export default RoomList;
