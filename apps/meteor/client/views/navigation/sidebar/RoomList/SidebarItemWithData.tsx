import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { SidebarV2Action, SidebarV2Actions, SidebarV2ItemIcon } from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import type { AllHTMLAttributes, MouseEvent } from 'react';
import { memo, useCallback, useMemo } from 'react';

import SidebarItem from './SidebarItem';
import SidebarItemMenu from './SidebarItemMenu';
import { RoomIcon } from '../../../../components/RoomIcon';
import { useUserStatusTooltip } from '../../../../hooks/useUserStatusTooltip';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { getUidDirectMessage } from '../../../../lib/utils/getUidDirectMessage';
import { useRoomsListContext, useIsRoomFilter, useRedirectToFilter } from '../../contexts/RoomsNavigationContext';
import SidebarItemBadges from '../badges/SidebarItemBadges';
import { useGroupDrop, useRoomDrag } from '../categories/CategoryDnDContext';
import { NAVIGATION_NATIVE_KEYS, getNativeCategoryKey } from '../categories/nativeCategory';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type RoomListRowProps = {
	t: TFunction;
	openedRoom?: string;
	isAnonymous?: boolean;

	room: SubscriptionWithRoom;
	id?: string;
	/* @deprecated */
	style?: AllHTMLAttributes<HTMLElement>['style'];

	/** The sidebar group this row belongs to (system filter key or custom category id). */
	groupKey?: string;
	isCustomCategory?: boolean;

	videoConfActions?: {
		[action: string]: () => void;
	};
};

const SidebarItemWithData = ({ room, id, style, t, videoConfActions, groupKey, isCustomCategory }: RoomListRowProps) => {
	const title = roomCoordinator.getRoomName(room.t, room) || '';
	const href = roomCoordinator.getRouteLink(room.t, room) || '';

	const dmUserId = getUidDirectMessage(room, useUserId());
	const dmStatusTooltipHandlers = useUserStatusTooltip(dmUserId, title);

	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const nativeKey = getNativeCategoryKey(room, { groupByType: Boolean(sidebarGroupByType), keys: NAVIGATION_NATIVE_KEYS });

	const { isDragging, ...dragProps } = useRoomDrag({ rid: room.rid, name: title, isFavorite: room.f, fromGroup: groupKey, nativeKey });
	const { isDragOver, isFadedOut, dropProps } = useGroupDrop(groupKey, Boolean(isCustomCategory));

	const dragStyle = {
		...style,
		// Suppress the iOS Safari long-press preview/callout on the room link; long-press opens the menu instead.
		WebkitTouchCallout: 'none' as const,
		// Inset + rounded hover/selected highlight (Slack-style): margins keep it off the sidebar edges.
		// Rooms are indented (content ~24px from the edge) so they read as nested under the category header.
		marginInline: '0.5rem',
		marginBlock: '1px',
		paddingInlineStart: '1.5rem',
		paddingInlineEnd: 'calc(0.5rem - 1px)',
		borderRadius: 'var(--rcx-border-radius-medium, 0.25rem)',
		...(isDragging || isFadedOut ? { opacity: isDragging ? 0.5 : 0.4 } : {}),
		// During drag-over, only tint the background — keep the inset margins and rounding so the drop area stays
		// rounded and the row's height doesn't change.
		...(isDragOver ? { backgroundColor: 'var(--rcx-color-surface-hover)' } : {}),
	};

	// Long-press (iOS) / right-click opens the room menu (the kebab) instead of the native preview/context menu.
	const handleContextMenu = useCallback((event: MouseEvent<HTMLElement>) => {
		const trigger = event.currentTarget.querySelector<HTMLButtonElement>('.rcx-sidebar-v2-item__menu-wrapper button');
		if (!trigger) {
			return;
		}
		event.preventDefault();
		trigger.click();
	}, []);

	const { unreadTitle, showUnread, highlightUnread: highlighted } = useUnreadDisplay(room);

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

	const { parentRid } = useRoomsListContext();

	const isRoomFilter = useIsRoomFilter();

	const selected = isRoomFilter && room.rid === parentRid;

	const redirectToFilter = useRedirectToFilter();
	const buttonProps = useButtonPattern(() => redirectToFilter(room));

	return (
		<SidebarItem
			id={id}
			data-unread={highlighted}
			data-drop-group={groupKey}
			unread={highlighted}
			href={href}
			selected={selected}
			aria-label={showUnread ? t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title }) : title}
			title={title}
			icon={icon}
			style={dragStyle}
			badges={<SidebarItemBadges room={room} roomTitle={title} />}
			room={room}
			actions={actions}
			menu={<SidebarItemMenu room={room} />}
			onContextMenu={handleContextMenu}
			{...dragProps}
			{...dropProps}
			{...buttonProps}
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

const keys: (keyof RoomListRowProps)[] = ['id', 'style', 't', 'videoConfActions', 'groupKey', 'isCustomCategory'];

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
