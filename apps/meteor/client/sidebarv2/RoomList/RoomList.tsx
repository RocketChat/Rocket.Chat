/* eslint-disable react/no-multi-comp */
import type { IRoom } from '@rocket.chat/core-typings';
import { SideBar } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useUserPreference, useUserId, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';

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

const computeItemKey = (index: number, room: IRoom): IRoom['_id'] | number => room._id || index;

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
		<SideBar ref={ref}>
			<Virtuoso
				totalCount={roomsList.length}
				data={roomsList}
				components={{ Item: RoomListRowWrapper, List: RoomListWrapper, Scroller: VirtuosoScrollbars }}
				computeItemKey={computeItemKey}
				itemContent={(_, data): ReactElement => <RoomListRow data={itemData} item={data} />}
			/>
		</SideBar>
	);
};

export default RoomList;
