import { Sidebar, Box, Badge } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import React, { forwardRef, useRef, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import memoize from 'memoize-one';

import { usePreventDefault } from './hooks/usePreventDefault';
import { filterMarkdown } from '../../app/markdown/lib/markdown';
import { useTranslation } from '../contexts/TranslationContext';
import { roomTypes } from '../../app/utils';
import { useUserPreference, useUserId } from '../contexts/UserContext';
import RoomMenu from './RoomMenu';
import { useSession } from '../contexts/SessionContext';
import Omnichannel from './sections/Omnichannel';
import { useTemplateByViewMode } from './hooks/useTemplateByViewMode';
import { useShortcutOpenMenu } from './hooks/useShortcutOpenMenu';
import { useAvatarTemplate } from './hooks/useAvatarTemplate';
import { useRoomList } from './hooks/useRoomList';
import { useRoomIcon } from '../hooks/useRoomIcon';
import { useSidebarPaletteColor } from './hooks/useSidebarPaletteColor';
import { escapeHTML } from '../../lib/escapeHTML';
import ScrollableContentWrapper from '../components/ScrollableContentWrapper';

const sections = {
	Omnichannel,
};

export const itemSizeMap = (sidebarViewMode) => {
	switch (sidebarViewMode) {
		case 'extended':
			return 44;
		case 'medium':
			return 36;
		case 'condensed':
		default:
			return 28;
	}
};

const SidebarIcon = ({ room, small }) => {
	const icon = useRoomIcon(room, small);

	return <Sidebar.Item.Icon {...icon.name && icon}>
		{!icon.name && icon}
	</Sidebar.Item.Icon>;
};

export const createItemData = memoize((extended, t, SideBarItemTemplate, AvatarTemplate, openedRoom, sidebarViewMode, isAnonymous) => ({
	extended,
	t,
	SideBarItemTemplate,
	AvatarTemplate,
	openedRoom,
	sidebarViewMode,
	isAnonymous,
}));

export const Row = React.memo(({ data, item }) => {
	const { extended, t, SideBarItemTemplate, AvatarTemplate, openedRoom, sidebarViewMode } = data;

	if (typeof item === 'string') {
		const Section = sections[item];
		return Section ? <Section aria-level='1' /> : <Sidebar.Section.Title aria-level='1'>{t(item)}</Sidebar.Section.Title>;
	}
	return <SideBarItemTemplateWithData sidebarViewMode={sidebarViewMode} selected={item.rid === openedRoom} t={t} room={item} extended={extended} SideBarItemTemplate={SideBarItemTemplate} AvatarTemplate={AvatarTemplate} />;
});

export const normalizeSidebarMessage = (message, t) => {
	if (message.msg) {
		return escapeHTML(filterMarkdown(message.msg));
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		if (attachment && attachment.description) {
			return escapeHTML(attachment.description);
		}

		if (attachment && attachment.title) {
			return escapeHTML(attachment.title);
		}

		return t('Sent_an_attachment');
	}
};

const ScrollerWithCustomProps = forwardRef((props, ref) => <ScrollableContentWrapper
	{...props}
	ref={ref}
	renderView={
		({ style, ...props }) => (
			<div {...props} className='teste' style={{ ...style, overflowX: 'hidden' }} />
		)
	}
	renderTrackHorizontal={(props) => <div {...props} style={{ display: 'none' }} className='track-horizontal'/>}
/>);

export default () => {
	useSidebarPaletteColor();
	const listRef = useRef();
	const { ref } = useResizeObserver({ debounceDelay: 100 });

	const openedRoom = useSession('openedRoom');

	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const sideBarItemTemplate = useTemplateByViewMode();
	const avatarTemplate = useAvatarTemplate();
	const extended = sidebarViewMode === 'extended';
	const isAnonymous = !useUserId();

	const t = useTranslation();

	const roomsList = useRoomList();
	const itemData = createItemData(extended, t, sideBarItemTemplate, avatarTemplate, openedRoom, sidebarViewMode, isAnonymous);

	usePreventDefault(ref);
	useShortcutOpenMenu(ref);

	useEffect(() => {
		listRef.current?.resetAfterIndex(0);
	}, [sidebarViewMode]);

	return <Box h='full' w='full' ref={ref}>
		<Virtuoso
			totalCount={roomsList.length}
			data={roomsList}
			components={{ Scroller: ScrollerWithCustomProps }}
			itemContent={(index, data) => <Row
				data={itemData}
				item={data}
			/>}
		/>
	</Box>;
};

const getMessage = (room, lastMessage, t) => {
	if (!lastMessage) {
		return t('No_messages_yet');
	}
	if (!lastMessage.u) {
		return normalizeSidebarMessage(lastMessage, t);
	}
	if (lastMessage.u?.username === room.u?.username) {
		return `${ t('You') }: ${ normalizeSidebarMessage(lastMessage, t) }`;
	}
	if (room.t === 'd' && room.uids && room.uids.length <= 2) {
		return normalizeSidebarMessage(lastMessage, t);
	}
	return `${ lastMessage.u.name || lastMessage.u.username }: ${ normalizeSidebarMessage(lastMessage, t) }`;
};

export const SideBarItemTemplateWithData = React.memo(function SideBarItemTemplateWithData({ room, id, extended, selected, SideBarItemTemplate, AvatarTemplate, t, style, sidebarViewMode, isAnonymous }) {
	const title = roomTypes.getRoomName(room.t, room);
	const icon = <SidebarIcon room={room} small={sidebarViewMode !== 'medium'}/>;
	const href = roomTypes.getRouteLink(room.t, room);

	const {
		lastMessage,
		hideUnreadStatus,
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

	const isQueued = room.status === 'queued';

	const threadUnread = tunread.length > 0;
	const message = extended && getMessage(room, lastMessage, t);

	const subtitle = message ? <span className='message-body--unstyled' dangerouslySetInnerHTML={{ __html: message }}/> : null;
	const variant = ((userMentions || tunreadUser.length) && 'danger') || (threadUnread && 'primary') || (groupMentions && 'warning') || 'ghost';
	const badges = unread > 0 || threadUnread ? <Badge style={{ flexShrink: 0 }} variant={ variant }>{unread + tunread?.length}</Badge> : null;

	return <SideBarItemTemplate
		is='a'
		id={id}
		data-qa='sidebar-item'
		aria-level='2'
		unread={!hideUnreadStatus && (alert || unread)}
		threadUnread={threadUnread}
		selected={selected}
		href={href}
		aria-label={title}
		title={title}
		time={lastMessage?.ts}
		subtitle={subtitle}
		icon={icon}
		style={style}
		badges={badges}
		avatar={AvatarTemplate && <AvatarTemplate {...room}/>}
		menu={!isAnonymous && !isQueued && (() => <RoomMenu alert={alert} threadUnread={threadUnread} rid={rid} unread={!!unread} roomOpen={false} type={type} cl={cl} name={title} status={room.status}/>)}
	/>;
}, (prevProps, nextProps) => {
	if (['id', 'style', 'extended', 'selected', 'SideBarItemTemplate', 'AvatarTemplate', 't', 'sidebarViewMode'].some((key) => prevProps[key] !== nextProps[key])) {
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
	if (prevProps.room.lastMessage?._updatedAt?.toISOString() !== nextProps.room.lastMessage?._updatedAt?.toISOString()) {
		return false;
	}
	if (prevProps.room.alert !== nextProps.room.alert) {
		return false;
	}
	if (prevProps.room.v?.status !== nextProps.room.v?.status) {
		return false;
	}

	return true;
});
