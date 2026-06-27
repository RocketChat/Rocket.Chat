import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { SidebarV2Action, SidebarV2Actions, SidebarV2ItemIcon } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useLayout, useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import type { AllHTMLAttributes, ComponentType, ReactNode } from 'react';
import { memo, useMemo } from 'react';

import { RoomIcon } from '../../components/RoomIcon';
import { useUserStatusTooltip } from '../../hooks/useUserStatusTooltip';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { getUidDirectMessage } from '../../lib/utils/getUidDirectMessage';
import { isIOsDevice } from '../../lib/utils/isIOsDevice';
import { getMessagePreview } from '../../lib/utils/normalizeMessagePreview/getMessagePreview';
import { useGroupDrop, useRoomDrag } from '../../views/navigation/sidebar/categories/CategoryDnDContext';
import { CLASSIC_NATIVE_KEYS, getNativeCategoryKey } from '../../views/navigation/sidebar/categories/nativeCategory';
import { useOmnichannelPriorities } from '../../views/omnichannel/hooks/useOmnichannelPriorities';
import RoomMenu from '../RoomMenu';
import SidebarItemBadges from '../badges/SidebarItemBadges';
import type { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type RoomListRowProps = {
	extended: boolean;
	t: TFunction;
	SidebarItemTemplate: ComponentType<
		{
			icon: ReactNode;
			title: ReactNode;
			avatar: ReactNode;
			actions: ReactNode;
			href: string;
			time?: Date;
			menu?: () => ReactNode;
			menuOptions?: unknown;
			subtitle?: ReactNode;
			titleIcon?: ReactNode;
			badges?: ReactNode;
			threadUnread?: boolean;
			unread?: boolean;
			selected?: boolean;
			is?: string;
		} & AllHTMLAttributes<HTMLElement>
	>;
	AvatarTemplate: ReturnType<typeof useAvatarTemplate>;
	openedRoom?: string;
	// sidebarViewMode: 'extended';
	isAnonymous?: boolean;
	userId?: string;

	room: SubscriptionWithRoom;
	id?: string;
	/* @deprecated */
	style?: AllHTMLAttributes<HTMLElement>['style'];

	selected?: boolean;

	sidebarViewMode?: unknown;
	videoConfActions?: {
		[action: string]: () => void;
	};

	/** The sidebar group this row belongs to (translation key for system groups, category id for custom ones). */
	groupKey?: string;
	isCustomCategory?: boolean;
};

const SidebarItemTemplateWithData = ({
	room,
	id,
	selected,
	style,
	extended,
	SidebarItemTemplate,
	AvatarTemplate,
	t,
	isAnonymous,
	videoConfActions,
	userId,
	groupKey,
	isCustomCategory,
}: RoomListRowProps) => {
	const { sidebar } = useLayout();

	const href = roomCoordinator.getRouteLink(room.t, room) || '';
	const title = roomCoordinator.getRoomName(room.t, room) || '';

	const dmUserId = getUidDirectMessage(room, userId);
	const dmStatusTooltipHandlers = useUserStatusTooltip(dmUserId, title);

	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const discussionEnabled = useSetting('Discussion_enabled');
	const nativeKey = getNativeCategoryKey(room, {
		groupByType: Boolean(sidebarGroupByType),
		discussionEnabled: Boolean(discussionEnabled),
		keys: CLASSIC_NATIVE_KEYS,
	});

	const { isDragging, ...dragProps } = useRoomDrag({ rid: room.rid, name: title, isFavorite: room.f, fromGroup: groupKey, nativeKey });
	const { isDragOver, isFadedOut, dropProps } = useGroupDrop(groupKey, Boolean(isCustomCategory));

	const dragStyle = {
		...style,
		...(isDragging || isFadedOut ? { opacity: isDragging ? 0.5 : 0.4 } : {}),
		...(isDragOver ? { backgroundColor: 'var(--rcx-color-surface-hover)' } : {}),
	};

	const { unreadTitle, showUnread, unreadCount, highlightUnread: highlighted } = useUnreadDisplay(room);

	const { lastMessage, unread = 0, alert, rid, t: type, cl } = room;

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

	const isQueued = isOmnichannelRoom(room) && room.status === 'queued';
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();

	const message = extended && getMessagePreview(room, lastMessage, t);
	const subtitle = message ? <span className='message-body--unstyled' dangerouslySetInnerHTML={{ __html: message }} /> : null;

	return (
		<SidebarItemTemplate
			is='a'
			id={id}
			data-unread={highlighted}
			unread={highlighted}
			selected={selected}
			aria-current={selected ? 'page' : undefined}
			href={href}
			{...dragProps}
			{...dropProps}
			onClick={(): void => {
				if (!selected) sidebar.toggle();
			}}
			aria-label={showUnread ? t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title }) : title}
			title={title}
			time={lastMessage?.ts}
			subtitle={subtitle}
			icon={icon}
			style={dragStyle}
			badges={<SidebarItemBadges room={room} roomTitle={title} />}
			avatar={AvatarTemplate && <AvatarTemplate {...room} />}
			actions={actions}
			menu={
				!isIOsDevice && !isAnonymous && (!isQueued || (isQueued && isPriorityEnabled))
					? () => (
							<RoomMenu
								alert={alert}
								threadUnread={unreadCount.threads > 0}
								rid={rid}
								unread={!!unread}
								roomOpen={selected}
								type={type}
								cl={cl}
								name={title}
								hideDefaultOptions={isQueued}
							/>
						)
					: undefined
			}
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

const keys: (keyof RoomListRowProps)[] = [
	'id',
	'style',
	'extended',
	'selected',
	'SidebarItemTemplate',
	'AvatarTemplate',
	't',
	'sidebarViewMode',
	'videoConfActions',
	'groupKey',
	'isCustomCategory',
];

export default memo(SidebarItemTemplateWithData, (prevProps, nextProps) => {
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
	if (prevProps.room.lastMessage?.msg !== nextProps.room.lastMessage?.msg) {
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
