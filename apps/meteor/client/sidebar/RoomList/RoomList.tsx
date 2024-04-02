import type { IRoom } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
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
import { useSidebarListNavigation } from './useSidebarListNavigation';

const computeItemKey = (index: number, room: IRoom): IRoom['_id'] | number => room._id || index;

const RoomList = (): ReactElement => {
	const t = useTranslation();
	const isAnonymous = !useUserId();
	const roomsList = useRoomList();
	const avatarTemplate = useAvatarTemplate();
	const sideBarItemTemplate = useTemplateByViewMode();
	const { ref } = useResizeObserver({ debounceDelay: 100 });
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
	const { sidebarListRef } = useSidebarListNavigation();

	const roomsListStyle = css`
		position: relative;

		display: flex;

		overflow-x: hidden;
		overflow-y: hidden;

		flex: 1 1 auto;

		height: 100%;

		&--embedded {
			margin-top: 2rem;
		}

		&__list:not(:last-child) {
			margin-bottom: 22px;
		}

		&__type {
			display: flex;

			flex-direction: row;

			padding: 0 var(--sidebar-default-padding) 1rem var(--sidebar-default-padding);

			color: var(--rooms-list-title-color);

			font-size: var(--rooms-list-title-text-size);
			align-items: center;
			justify-content: space-between;

			&-text--livechat {
				flex: 1;
			}
		}

		&__empty-room {
			padding: 0 var(--sidebar-default-padding);

			color: var(--rooms-list-empty-text-color);

			font-size: var(--rooms-list-empty-text-size);
		}

		&__toolbar-search {
			position: absolute;
			z-index: 10;
			left: 0;

			overflow-y: scroll;

			height: 100%;

			background-color: var(--sidebar-background);

			padding-block-start: 12px;
		}

		@media (max-width: 400px) {
			padding: 0 calc(var(--sidebar-small-default-padding) - 4px);

			&__type,
			&__empty-room {
				padding: 0 calc(var(--sidebar-small-default-padding) - 4px) 0.5rem calc(var(--sidebar-small-default-padding) - 4px);
			}
		}
	`;

	return (
		<Box ref={sidebarListRef} className={[roomsListStyle, 'sidebar--custom-colors'].filter(Boolean)} aria-label={t('Channels')} role='list'>
			<Box h='full' w='full' ref={ref}>
				<Virtuoso
					totalCount={roomsList.length}
					data={roomsList}
					components={{ Scroller: VirtuosoScrollbars }}
					computeItemKey={computeItemKey}
					itemContent={(_, data): ReactElement => <RoomListRow data={itemData} item={data} />}
				/>
			</Box>
		</Box>
	);
};

export default RoomList;
