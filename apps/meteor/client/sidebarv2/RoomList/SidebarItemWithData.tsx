import { isDirectMessageRoom, isOmnichannelRoom, isTeamRoom } from '@rocket.chat/core-typings';
import { SidebarV2Action, SidebarV2Actions, SidebarV2ItemBadge, SidebarV2ItemIcon } from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import type { AllHTMLAttributes } from 'react';
import { memo, useCallback, useMemo } from 'react';

import SidebarItem from './SidebarItem';
import { RoomIcon } from '../../components/RoomIcon';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { useSwitchSidePanelTab, useRoomsListContext, useIsRoomFilter } from '../../views/navigation/contexts/RoomsNavigationContext';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type RoomListRowProps = {
	t: TFunction;
	openedRoom?: string;
	isAnonymous?: boolean;

	room: SubscriptionWithRoom;
	id?: string;
	/* @deprecated */
	style?: AllHTMLAttributes<HTMLElement>['style'];

	videoConfActions?: {
		[action: string]: () => void;
	};
};

const SidebarItemWithData = ({ room, id, style, t, videoConfActions }: RoomListRowProps) => {
	const title = roomCoordinator.getRoomName(room.t, room) || '';
	const href = roomCoordinator.getRouteLink(room.t, room) || '';

	const { unreadTitle, unreadVariant, showUnread, unreadCount, highlightUnread: highlighted } = useUnreadDisplay(room);

	const icon = (
		<SidebarV2ItemIcon
			highlighted={highlighted}
			icon={<RoomIcon room={room} placement='sidebar' size='x20' isIncomingCall={Boolean(videoConfActions)} />}
		/>
	);

	const actions = useMemo(
		() =>
			videoConfActions && (
				<SidebarV2Actions>
					<SidebarV2Action onClick={videoConfActions.acceptCall} mini secondary success icon='phone' />
					<SidebarV2Action onClick={videoConfActions.rejectCall} mini secondary danger icon='phone-off' />
				</SidebarV2Actions>
			),
		[videoConfActions],
	);

	const badges = (
		<>
			{showUnread && (
				<SidebarV2ItemBadge
					variant={unreadVariant}
					title={unreadTitle}
					role='status'
					aria-label={t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title })}
				>
					<span aria-hidden>{unreadCount.total}</span>
				</SidebarV2ItemBadge>
			)}
		</>
	);

	const switchSidePanelTab = useSwitchSidePanelTab();
	const { parentRid } = useRoomsListContext();

	const isRoomFilter = useIsRoomFilter();

	const selected = isRoomFilter && room.rid === parentRid;

	const handleClick = useCallback(() => {
		if (isTeamRoom(room)) {
			switchSidePanelTab('teams', { parentRid: room.rid });
			return;
		}

		if (isDirectMessageRoom(room)) {
			switchSidePanelTab('directMessages', { parentRid: room.rid });
			return;
		}

		switchSidePanelTab('channels', { parentRid: room.rid });
	}, [room, switchSidePanelTab]);

	const buttonProps = useButtonPattern(handleClick);

	return (
		<SidebarItem
			id={id}
			data-qa='sidebar-item'
			data-unread={highlighted}
			unread={highlighted}
			href={href}
			selected={selected}
			aria-label={showUnread ? t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title }) : title}
			title={title}
			icon={icon}
			style={style}
			badges={badges}
			room={room}
			actions={actions}
			{...buttonProps}
		/>
	);
};

function safeDateNotEqualCheck(a: Date | string | undefined, b: Date | string | undefined): boolean {
	if (!a || !b) {
		return a !== b;
	}
	return new Date(a).toISOString() !== new Date(b).toISOString();
}

const keys: (keyof RoomListRowProps)[] = ['id', 'style', 't', 'videoConfActions'];

// eslint-disable-next-line react/no-multi-comp
export default memo(SidebarItemWithData, (prevProps, nextProps) => {
	if (keys.some((key) => prevProps[key] !== nextProps[key])) {
		return false;
	}

	if (prevProps.room === nextProps.room) {
		return true;
	}

	if (prevProps.room._id !== nextProps.room._id) {
		return false;
	}
	if (prevProps.room._updatedAt?.toISOString() !== nextProps.room._updatedAt?.toISOString()) {
		return false;
	}
	if (safeDateNotEqualCheck(prevProps.room.lastMessage?._updatedAt, nextProps.room.lastMessage?._updatedAt)) {
		return false;
	}
	if (prevProps.room.alert !== nextProps.room.alert) {
		return false;
	}
	if (isOmnichannelRoom(prevProps.room) && isOmnichannelRoom(nextProps.room) && prevProps.room?.v?.status !== nextProps.room?.v?.status) {
		return false;
	}
	if (prevProps.room.teamMain !== nextProps.room.teamMain) {
		return false;
	}

	if (
		isOmnichannelRoom(prevProps.room) &&
		isOmnichannelRoom(nextProps.room) &&
		prevProps.room.priorityWeight !== nextProps.room.priorityWeight
	) {
		return false;
	}

	return true;
});
