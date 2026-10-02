import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { IconButton, ItemActions } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserId } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import type { AllHTMLAttributes } from 'react';
import { memo, useMemo } from 'react';

import RoomListItem from './RoomListItem';
import { RoomIcon } from '../../../../components/RoomIcon';
import { useUserStatusTooltip } from '../../../../hooks/useUserStatusTooltip';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { getUidDirectMessage } from '../../../../lib/utils/getUidDirectMessage';
import { useRoomsListContext, useIsRoomFilter, useRedirectToFilter } from '../../contexts/RoomsNavigationContext';
import SidebarItemBadges from '../badges/SidebarItemBadges';
import { useRoomIconLabel } from '../hooks/useRoomIconLabel';
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

	const dmUserId = getUidDirectMessage(room, useUserId());
	const dmStatusTooltipHandlers = useUserStatusTooltip(dmUserId, title);

	const { unreadTitle, showUnread, highlightUnread: highlighted } = useUnreadDisplay(room);

	const isIncomingCall = Boolean(videoConfActions);
	const iconLabel = useRoomIconLabel(room, isIncomingCall);

	const actions = useMemo(
		() =>
			videoConfActions && (
				<ItemActions>
					<IconButton onClick={videoConfActions.acceptCall} mini secondary success icon='phone' aria-label={t('Accept_Call')} />
					<IconButton onClick={videoConfActions.rejectCall} mini secondary danger icon='phone-off' aria-label={t('Reject_call')} />
				</ItemActions>
			),
		[videoConfActions, t],
	);

	const { parentRid } = useRoomsListContext();

	const isRoomFilter = useIsRoomFilter();

	const selected = isRoomFilter && room.rid === parentRid;

	const redirectToFilter = useRedirectToFilter();

	return (
		<RoomListItem
			id={id}
			size='condensed'
			data-unread={highlighted}
			highlighted={highlighted}
			selected={selected}
			aria-current={selected || undefined}
			aria-label={showUnread ? t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title }) : title}
			onClick={() => redirectToFilter(room)}
			title={title}
			icon={<RoomIcon room={room} placement='sidebar' size='x20' isIncomingCall={isIncomingCall} />}
			iconLabel={iconLabel}
			style={style}
			badges={<SidebarItemBadges room={room} roomTitle={title} />}
			room={room}
			actions={actions}
			{...dmStatusTooltipHandlers}
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
