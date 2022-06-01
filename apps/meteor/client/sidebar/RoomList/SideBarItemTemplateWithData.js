import { Badge, Sidebar } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import { RoomIcon } from '../../components/RoomIcon';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import RoomMenu from '../RoomMenu';
import { normalizeSidebarMessage } from './normalizeSidebarMessage';

const getMessage = (room, lastMessage, t) => {
	if (!lastMessage) {
		return t('No_messages_yet');
	}
	if (!lastMessage.u) {
		return normalizeSidebarMessage(lastMessage, t);
	}
	if (lastMessage.u?.username === room.u?.username) {
		return `${t('You')}: ${normalizeSidebarMessage(lastMessage, t)}`;
	}
	if (room.t === 'd' && room.uids && room.uids.length <= 2) {
		return normalizeSidebarMessage(lastMessage, t);
	}
	return `${lastMessage.u.name || lastMessage.u.username}: ${normalizeSidebarMessage(lastMessage, t)}`;
};

function SideBarItemTemplateWithData({
	room,
	id,
	extended,
	selected,
	SideBarItemTemplate,
	AvatarTemplate,
	t,
	style,
	// sidebarViewMode,
	isAnonymous,
}) {
	const { sidebar } = useLayout();

	const href = roomCoordinator.getRouteLink(room.t, room);
	const title = roomCoordinator.getRoomName(room.t, room);

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

	const highlighted = !hideUnreadStatus && (alert || unread);
	const icon = (
		<Sidebar.Item.Icon highlighted={highlighted}>
			<RoomIcon highlighted={highlighted} room={room} placement='sidebar' />
		</Sidebar.Item.Icon>
	);

	const isQueued = room.status === 'queued';

	const threadUnread = tunread.length > 0;
	const message = extended && getMessage(room, lastMessage, t);

	const subtitle = message ? <span className='message-body--unstyled' dangerouslySetInnerHTML={{ __html: message }} /> : null;
	const variant =
		((userMentions || tunreadUser.length) && 'danger') || (threadUnread && 'primary') || (groupMentions && 'warning') || 'ghost';
	const isUnread = unread > 0 || threadUnread;
	const showBadge = !hideUnreadStatus || (!hideMentionStatus && userMentions);
	const badges =
		showBadge && isUnread ? (
			<Badge style={{ flexShrink: 0 }} variant={variant}>
				{unread + tunread?.length}
			</Badge>
		) : null;

	return (
		<SideBarItemTemplate
			is='a'
			id={id}
			data-qa='sidebar-item'
			aria-level='2'
			unread={highlighted}
			threadUnread={threadUnread}
			selected={selected}
			href={href}
			onClick={() => !selected && sidebar.toggle()}
			aria-label={title}
			title={title}
			time={lastMessage?.ts}
			subtitle={subtitle}
			icon={icon}
			style={style}
			badges={badges}
			avatar={AvatarTemplate && <AvatarTemplate {...room} />}
			menu={
				!isAnonymous &&
				!isQueued &&
				(() => (
					<RoomMenu
						alert={alert}
						threadUnread={threadUnread}
						rid={rid}
						unread={!!unread}
						roomOpen={false}
						type={type}
						cl={cl}
						name={title}
						status={room.status}
					/>
				))
			}
		/>
	);
}

function safeDateNotEqualCheck(a, b) {
	if (!a || !b) {
		return a !== b;
	}
	return new Date(a).toISOString() !== new Date(b).toISOString();
}

const propsAreEqual = (prevProps, nextProps) => {
	if (
		['id', 'style', 'extended', 'selected', 'SideBarItemTemplate', 'AvatarTemplate', 't', 'sidebarViewMode'].some(
			(key) => prevProps[key] !== nextProps[key],
		)
	) {
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
	if (safeDateNotEqualCheck(prevProps.lastMessage?._updatedAt, nextProps.lastMessage?._updatedAt)) {
		return false;
	}
	if (prevProps.room.alert !== nextProps.room.alert) {
		return false;
	}
	if (prevProps.room.v?.status !== nextProps.room.v?.status) {
		return false;
	}
	if (prevProps.room.teamMain !== nextProps.room.teamMain) {
		return false;
	}

	return true;
};

export default memo(SideBarItemTemplateWithData, propsAreEqual);
