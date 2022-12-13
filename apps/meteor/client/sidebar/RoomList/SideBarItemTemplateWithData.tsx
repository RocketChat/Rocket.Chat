/* eslint-disable react/display-name */
import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isDirectMessageRoom, isMultipleDirectMessageRoom, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { Badge, Sidebar, SidebarItemAction } from '@rocket.chat/fuselage';
import type { useTranslation } from '@rocket.chat/ui-contexts';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes, ComponentType, ReactElement, ReactNode } from 'react';
import React, { memo, useMemo } from 'react';

import { RoomIcon } from '../../components/RoomIcon';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import RoomMenu from '../RoomMenu';
import type { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { normalizeSidebarMessage } from './normalizeSidebarMessage';

const getMessage = (room: IRoom, lastMessage: IMessage | undefined, t: ReturnType<typeof useTranslation>): string | undefined => {
	if (!lastMessage) {
		return t('No_messages_yet');
	}
	if (!lastMessage.u) {
		return normalizeSidebarMessage(lastMessage, t);
	}
	if (lastMessage.u?.username === room.u?.username) {
		return `${t('You')}: ${normalizeSidebarMessage(lastMessage, t)}`;
	}
	if (isDirectMessageRoom(room) && !isMultipleDirectMessageRoom(room)) {
		return normalizeSidebarMessage(lastMessage, t);
	}
	return `${lastMessage.u.name || lastMessage.u.username}: ${normalizeSidebarMessage(lastMessage, t)}`;
};

type RoomListRowProps = {
	extended: boolean;
	t: ReturnType<typeof useTranslation>;
	SideBarItemTemplate: ComponentType<
		{
			icon: ReactNode;
			title: ReactNode;
			avatar: ReactNode;
			actions: unknown;
			href: string;
			time?: Date;
			menu?: ReactNode;
			menuOptions?: unknown;
			subtitle?: ReactNode;
			titleIcon?: string;
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

	room: ISubscription & IRoom;
	id?: string;
	/* @deprecated */
	style?: AllHTMLAttributes<HTMLElement>['style'];

	selected?: boolean;

	sidebarViewMode?: unknown;
	videoConfActions?: {
		[action: string]: () => void;
	};
};

function SideBarItemTemplateWithData({
	room,
	id,
	selected,
	style,
	extended,
	SideBarItemTemplate,
	AvatarTemplate,
	t,
	// sidebarViewMode,
	isAnonymous,
	videoConfActions,
}: RoomListRowProps): ReactElement {
	const { sidebar } = useLayout();

	const href = roomCoordinator.getRouteLink(room.t, room) || '';
	const title = roomCoordinator.getRoomName(room.t, room) || '';

	const {
		lastMessage,
		hideUnreadStatus,
		hideMentionStatus,
		unread = 0,
		alert,
		userMentions,
		groupMentions,
		tunread = [],
		tunreadUser = [],
		rid,
		t: type,
		cl,
	} = room;

	const highlighted = Boolean(!hideUnreadStatus && (alert || unread));
	const icon = (
		// TODO: Remove icon='at'
		<Sidebar.Item.Icon highlighted={highlighted} icon='at'>
			<RoomIcon room={room} placement='sidebar' isIncomingCall={Boolean(videoConfActions)} />
		</Sidebar.Item.Icon>
	);

	const actions = useMemo(
		() =>
			videoConfActions && (
				<>
					<SidebarItemAction onClick={videoConfActions.acceptCall} secondary success icon='phone' />
					<SidebarItemAction onClick={videoConfActions.rejectCall} secondary danger icon='phone-off' />
				</>
			),
		[videoConfActions],
	);

	const isQueued = isOmnichannelRoom(room) && room.status === 'queued';

	const threadUnread = tunread.length > 0;
	const message = extended && getMessage(room, lastMessage, t);

	const subtitle = message ? <span className='message-body--unstyled' dangerouslySetInnerHTML={{ __html: message }} /> : null;
	const variant =
		((userMentions || tunreadUser.length) && 'danger') || (threadUnread && 'primary') || (groupMentions && 'warning') || 'ghost';
	const isUnread = unread > 0 || threadUnread;
	const showBadge = !hideUnreadStatus || (!hideMentionStatus && userMentions);
	const badges =
		showBadge && isUnread ? (
			// TODO: Remove any
			<Badge {...({ style: { flexShrink: 0 } } as any)} variant={variant}>
				{unread + tunread?.length}
			</Badge>
		) : null;

	return (
		<SideBarItemTemplate
			is='a'
			id={id}
			data-qa='sidebar-item'
			aria-level={2}
			unread={highlighted}
			selected={selected}
			href={href}
			onClick={(): void => !selected && sidebar.toggle()}
			aria-label={title}
			title={title}
			time={lastMessage?.ts}
			subtitle={subtitle}
			icon={icon}
			style={style}
			badges={badges}
			avatar={AvatarTemplate && <AvatarTemplate {...room} />}
			actions={actions}
			menu={
				!isAnonymous &&
				!isQueued &&
				((): ReactElement => (
					<RoomMenu
						alert={alert}
						threadUnread={threadUnread}
						rid={rid}
						unread={!!unread}
						roomOpen={false}
						type={type}
						cl={cl}
						name={title}
					/>
				))
			}
		/>
	);
}

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
	'SideBarItemTemplate',
	'AvatarTemplate',
	't',
	'sidebarViewMode',
	'videoConfActions',
];

// eslint-disable-next-line react/no-multi-comp
export default memo(SideBarItemTemplateWithData, (prevProps, nextProps) => {
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

	return true;
});
