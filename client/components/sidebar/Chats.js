import s from 'underscore.string';
import { Sidebar, Box, Badge } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import memoize from 'memoize-one';
import tinykeys from 'tinykeys';

import { usePreventDefault } from './hooks/usePreventDefault';
import { renderMessageBody } from '../../../app/ui-utils/client';
import { ReactiveUserStatus, colors } from '../basic/UserStatus';
import { ChatSubscription } from '../../../app/models';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useTranslation } from '../../contexts/TranslationContext';
import { useQueuedInquiries, useOmnichannelEnabled } from '../../contexts/OmnichannelContext';
import { useSetting } from '../../contexts/SettingsContext';
import { roomTypes } from '../../../app/utils';
import { useUserPreference } from '../../contexts/UserContext';
import Condensed from './Condensed';
import Extended from './Extended';
import Medium from './Medium';
import RoomAvatar from '../basic/avatar/RoomAvatar';
import RoomMenu from './RoomMenu';
import { useSession } from '../../contexts/SessionContext';
import Omnichannel from './sections/Omnichannel';

const query = { open: { $ne: false } };


const sections = {
	Omnichannel,
};

const style = {
	overflow: 'scroll',
};

export const useChatRoomTemplate = (sidebarViewMode) => useMemo(() => {
	switch (sidebarViewMode) {
		case 'extended':
			return Extended;
		case 'medium':
			return Medium;
		case 'condensed':
		default:
			return Condensed;
	}
}, [sidebarViewMode]);

export const useAvatarTemplate = (sidebarHideAvatar, sidebarViewMode) => useMemo(() => {
	if (sidebarHideAvatar) {
		return null;
	}

	const size = (() => {
		switch (sidebarViewMode) {
			case 'extended':
				return 'x36';
			case 'medium':
				return 'x28';
			case 'condensed':
			default:
				return 'x16';
		}
	})();

	return React.memo((room) => <RoomAvatar size={size} room={{ ...room, _id: room.rid || room._id, type: room.t }} />);
}, [sidebarHideAvatar, sidebarViewMode]);

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

const SidebarIcon = ({ room }) => {
	switch (room.t) {
		case 'p':
		case 'c':
			return <Sidebar.Item.Icon aria-hidden='true' name={roomTypes.getIcon(room)} />;
		case 'l':
			return <Sidebar.Item.Icon aria-hidden='true' name='headset' color={colors[room.v.status]}/>;
		case 'd':
			if (room.uids && room.uids.length > 2) {
				return <Sidebar.Item.Icon aria-hidden='true' name='team'/>;
			}
			if (room.uids && room.uids.length > 0) {
				return room.uids && room.uids.length && <Sidebar.Item.Icon><ReactiveUserStatus uid={room.uids.filter((uid) => uid !== room.u._id)[0]} /></Sidebar.Item.Icon>;
			}
			return <Sidebar.Item.Icon aria-hidden='true' name={roomTypes.getIcon(room)}/>;
		default:
			return null;
	}
};

export const createItemData = memoize((items, extended, t, SideBarItemTemplate, AvatarTemplate, openedRoom) => ({
	items,
	extended,
	t,
	SideBarItemTemplate,
	AvatarTemplate,
	openedRoom,
}));

export const Row = React.memo(({ data, index, style }) => {
	const { extended, items, t, SideBarItemTemplate, AvatarTemplate, openedRoom } = data;
	const item = items[index];
	if (typeof item === 'string') {
		const Section = sections[item];
		return Section ? <Section aria-level='1' style={style}/> : <Sidebar.Section.Title aria-level='1' style={style}>{t(item)}</Sidebar.Section.Title>;
	}
	return <SideBarItemTemplateWithData style={style} selected={item.rid === openedRoom} t={t} room={item} extended={extended} SideBarItemTemplate={SideBarItemTemplate} AvatarTemplate={AvatarTemplate} />;
});

export const normalizeThreadMessage = ({ ...message }) => {
	if (message.msg) {
		return renderMessageBody(message).replace(/<br\s?\\?>/g, ' ');
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		if (attachment && attachment.description) {
			return s.escapeHTML(attachment.description);
		}

		if (attachment && attachment.title) {
			return s.escapeHTML(attachment.title);
		}
	}
};


// used to open the menu option by keyboard
const useShortcutOpenMenu = (ref) => {
	useEffect(() => {
		const unsubscribe = tinykeys(ref.current, {
			Alt: (event) => {
				if (!event.target.className.includes('rcx-sidebar-item')) {
					return;
				}
				event.preventDefault();
				event.target.querySelector('button').click();
			},
		});
		return () => {
			unsubscribe();
		};
	}, []);
};

export default () => {
	const t = useTranslation();

	const openedRoom = useSession('openedRoom');

	const sortBy = useUserPreference('sidebarSortby');
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const sidebarHideAvatar = useUserPreference('sidebarHideAvatar');
	const favoritesEnabled = useUserPreference('sidebarShowFavorites');
	const showDiscussion = useUserPreference('sidebarShowDiscussion');
	const sidebarShowUnread = useUserPreference('sidebarShowUnread');
	const showRealName = useSetting('UI_Use_Real_Name');
	const SideBarItemTemplate = useChatRoomTemplate(sidebarViewMode);

	const showOmnichannel = useOmnichannelEnabled();
	const AvatarTemplate = useAvatarTemplate(sidebarHideAvatar, sidebarViewMode);

	const sort = useMemo(() => ({
		...sortBy === 'activity' && { lm: -1 },
		...sortBy !== 'activity' && {
			...showRealName && { lowerCaseFName: /descending/.test(sortBy) ? -1 : 1 },
			...!showRealName && { lowerCaseName: /descending/.test(sortBy) ? -1 : 1 },
		},
	}), [sortBy, showRealName]);

	const rooms = useReactiveValue(useCallback(() => ChatSubscription.find(query, { sort }).fetch(), [sort]));

	const inquiries = useQueuedInquiries();

	const groups = useMemo(() => {
		const favorite = new Set();
		const omnichannel = new Set();
		const unread = new Set();
		const _private = new Set();
		const _public = new Set();
		const direct = new Set();
		const discussion = new Set();
		const conversation = new Set();

		rooms.forEach((room) => {
			if (sidebarShowUnread && (room.alert || room.unread) && !room.hideUnreadStatus) {
				return unread.add(room);
			}

			if (favoritesEnabled && room.f) {
				return favorite.add(room);
			}

			if (showDiscussion && room.prid) {
				return discussion.add(room);
			}

			if (room.t === 'c') {
				_public.add(room);
			}

			if (room.t === 'p') {
				_private.add(room);
			}

			if (room.t === 'l') {
				return showOmnichannel && omnichannel.add(room);
			}

			if (room.t === 'd') {
				direct.add(room);
			}

			conversation.add(room);
		});

		const groups = new Map();
		showOmnichannel && inquiries.enabled && groups.set('Omnichannel', []);
		showOmnichannel && !inquiries.enabled && groups.set('Omnichannel', omnichannel);
		showOmnichannel && inquiries.enabled && inquiries.queue.length && groups.set('Incoming_Livechats', inquiries.queue);
		showOmnichannel && inquiries.enabled && omnichannel.size && groups.set('Open_Livechats', omnichannel);
		sidebarShowUnread && unread.size && groups.set('Unread', unread);
		favoritesEnabled && favorite.size && groups.set('Favorites', favorite);
		showDiscussion && discussion.size && groups.set('Discussions', discussion);
		sidebarGroupByType && groups.set('Private', _private);
		sidebarGroupByType && groups.set('Public', _public);
		sidebarGroupByType && groups.set('Direct', direct);
		!sidebarGroupByType && groups.set('Conversations', conversation);
		return groups;
	}, [rooms, showOmnichannel, inquiries.enabled, inquiries.queue, favoritesEnabled, sidebarShowUnread, showDiscussion, sidebarGroupByType]);

	const extended = sidebarViewMode === 'extended';

	const items = useMemo(() => [...groups.entries()].flatMap(([key, group]) => [key, ...group]), [groups]);
	const { ref, contentBoxSize: { blockSize = 750 } = {} } = useResizeObserver({ debounceDelay: 100 });


	const itemSize = itemSizeMap(sidebarViewMode);

	const itemData = createItemData(items, extended, t, SideBarItemTemplate, AvatarTemplate, openedRoom);

	usePreventDefault(ref);
	useShortcutOpenMenu(ref);

	const listRef = useRef();

	useEffect(() => {
		listRef.current?.resetAfterIndex(0);
	}, [sidebarViewMode]);

	return <Box h='full' w='full' ref={ref}>
		<List
			height={blockSize}
			itemCount={items.length}
			itemSize={(index) => (typeof items[index] === 'string' ? (sections[items[index]] && sections[items[index]].size) || 40 : itemSize)}
			itemData={itemData}
			overscanCount={10}
			width='100%'
			ref={listRef}
			style={style}
		>
			{Row}
		</List>
	</Box>;
};

const getMessage = (room, lastMessage, t) => {
	if (!lastMessage) {
		return t('No_messages_yet');
	}
	if (!lastMessage.u) {
		return normalizeThreadMessage(lastMessage);
	}
	if (lastMessage.u?.username === room.u?.username) {
		return `${ t('You') }: ${ normalizeThreadMessage(lastMessage) }`;
	}
	if (room.t === 'd' && room.uids.length <= 2) {
		return normalizeThreadMessage(lastMessage);
	}
	return `${ lastMessage.u.name || lastMessage.u.username }: ${ normalizeThreadMessage(lastMessage) }`;
};

export const SideBarItemTemplateWithData = React.memo(({ room, id, extended, selected, SideBarItemTemplate, AvatarTemplate, t, style }) => {
	const title = roomTypes.getRoomName(room.t, room);
	const icon = <SidebarIcon room={room}/>;
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

	const threadUnread = tunread.length > 0;
	const message = extended && getMessage(room, lastMessage, t);

	const subtitle = message ? <span className='message-body--unstyled' dangerouslySetInnerHTML={{ __html: message }}/> : null;
	const variant = ((userMentions || tunreadUser.length) && 'danger') || (threadUnread && 'primary') || (groupMentions && 'warning') || 'ghost';
	const badges = unread > 0 || threadUnread ? <Badge variant={ variant } flexShrink={0}>{unread + tunread?.length}</Badge> : null;

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
		menu={() => <RoomMenu rid={rid} unread={!!unread} roomOpen={false} type={type} cl={cl} name={title} status={room.status}/>}
	/>;
});
