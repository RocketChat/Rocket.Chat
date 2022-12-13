import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useSession, useUserPreference, useUserId, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useRoomList } from '../hooks/useRoomList';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';
import { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';
import RoomListRow from './RoomListRow';
import ScrollerWithCustomProps from './ScrollerWithCustomProps';

const computeItemKey = (index: number, room: IRoom): IRoom['_id'] | number => room._id || index;

const RoomList = (): ReactElement => {
	const t = useTranslation();
	const isAnonymous = !useUserId();
	const roomsList = useRoomList();
	const avatarTemplate = useAvatarTemplate();
	const sideBarItemTemplate = useTemplateByViewMode();
	const { ref } = useResizeObserver({ debounceDelay: 100 });
	const openedRoom = (useSession('openedRoom') as string) || '';
	const sidebarViewMode = useUserPreference<'extended' | 'medium' | 'condensed'>('sidebarViewMode') || 'extended';

	const extended = sidebarViewMode === 'extended';
	const itemData = useMemo(
		() => ({
			extended,
			t,
			SideBarItemTemplate: sideBarItemTemplate,
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
		<Box h='full' w='full' ref={ref}>
			<Virtuoso
				totalCount={roomsList.length}
				data={roomsList}
				components={{ Scroller: ScrollerWithCustomProps }}
				computeItemKey={computeItemKey}
				itemContent={(_, data): ReactElement => <RoomListRow data={itemData} item={data} />}
			/>
		</Box>
	);
};

export default RoomList;
