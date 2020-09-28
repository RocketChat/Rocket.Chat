
import { Sidebar, Box, Badge } from '@rocket.chat/fuselage';
import { useResizeObserver, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import memoize from 'memoize-one';

import { ChatSubscription } from '../../../app/models';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useTranslation } from '../../contexts/TranslationContext';
import { useSetting } from '../../contexts/SettingsContext';
import { roomTypes } from '../../../app/utils';
import { useUserPreference } from '../../contexts/UserContext';
import { usePermission } from '../../contexts/AuthorizationContext';
import Condensed from './Condensed';
import Extended from './Extended';
import Medium from './Medium';
import RoomAvatar from '../basic/avatar/RoomAvatar';
import RoomMenu from './RoomMenu';
import { useSession } from '../../contexts/SessionContext';

const query = {};

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
				return 'x38';
			case 'medium':
				return 'x28';
			case 'condensed':
			default:
				return 'x16';
		}
	})();

	return React.memo((room) => <RoomAvatar size={size} room={{ ...room, _id: room.rid, type: room.t }} />);
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
		return <Sidebar.Section.Title style={style}>{t(item)}</Sidebar.Section.Title>;
	}
	return <SideBarItemTemplateWithData style={style} selected={item.rid === openedRoom} t={t} room={item} extended={extended} SideBarItemTemplate={SideBarItemTemplate} AvatarTemplate={AvatarTemplate} />;
});

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

	const omnichannelEnabled = useSetting('Livechat_enabled');
	const showOmnichannel = usePermission('view-l-room') && omnichannelEnabled;
	const AvatarTemplate = useAvatarTemplate(sidebarHideAvatar, sidebarViewMode);

	const sort = useMemo(() => ({
		...sortBy === 'activity' && { lm: -1 },
		...sortBy !== 'activity' && {
			...showRealName && { lowerCaseFName: /descending/.test(sortBy) ? -1 : 1 },
			...!showRealName && { lowerCaseName: /descending/.test(sortBy) ? -1 : 1 },
		},
	}), [sortBy, showRealName]);

	const rooms = useReactiveValue(useCallback(() => ChatSubscription.find(query, { sort }).fetch(), [query, sort]));

	const groups = useMemo(() => {
		const favorite = new Set();
		const omnichannel = new Set();
		const unread = new Set();
		const _private = new Set();
		const _public = new Set();
		const direct = new Set();
		const discussion = new Set();
		const channels = new Set();

		rooms.forEach((room) => {
			if (favoritesEnabled && room.f) {
				return favorite.add(room);
			}

			if (sidebarShowUnread && room.alert && room.unread && !room.hideUnreadStatus) {
				return unread.add(room);
			}

			if (showDiscussion && room.drid) {
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

			channels.add(room);
		});

		const groups = new Map();

		favoritesEnabled && groups.set('Favorites', favorite);
		sidebarShowUnread && groups.set('Unread', unread);
		groups.set('Omnichannel', omnichannel);
		sidebarGroupByType && groups.set('Private', _private);
		sidebarGroupByType && groups.set('Public', _public);
		sidebarGroupByType && groups.set('Direct', direct);
		!sidebarGroupByType && groups.set('Channels', channels);
		showDiscussion && groups.set('Discussions', discussion);
		return groups;
	}, [favoritesEnabled, rooms, showDiscussion, sidebarShowUnread, showOmnichannel, sidebarGroupByType]);

	const extended = sidebarViewMode === 'extended';

	const items = useMemo(() => [...groups.entries()].flatMap(([key, group]) => [key, ...group]), [groups]);
	const { ref, contentBoxSize: { blockSize = 750 } = {} } = useResizeObserver({ debounceDelay: 100 });

	const listRef = useRef();

	const itemSize = itemSizeMap(sidebarViewMode);

	useEffect(() => {
		listRef.current && listRef.current.resetAfterIndex(0);
	}, [itemSize]);


	const itemData = createItemData(items, extended, t, SideBarItemTemplate, AvatarTemplate, openedRoom);


	// Flowrouter uses an addEventListener on the document to capture any clink link, since the react synthetic event use an addEventListener on the document too,
	// it is impossible/hard to determine which one will happen before and prevent/stop propagation, so feel free to remove this effect after remove flow router :)
	const stopPropagation = useMutableCallback((e) => {
		if ([e.target.nodeName, e.target.parentElement.nodeName].includes('BUTTON')) {
			e.preventDefault();
		}
	});

	useEffect(() => {
		const { current } = ref;
		current.addEventListener('click', stopPropagation);

		return () => current.addEventListener('click', stopPropagation);
	}, [ref, stopPropagation]);

	return <Box h='full' w='full' ref={ref}>
		<List
			height={blockSize}
			estimatedItemSize={itemSize}
			itemCount={items.length}
			itemSize={(index) => (typeof items[index] === 'string' ? 40 : itemSize)}
			itemData={itemData}
			overscanCount={25}
			width='100%'
			ref={listRef}
		>
			{Row}
		</List>
	</Box>;
};

export const SideBarItemTemplateWithData = React.memo(({ room, extended, selected, SideBarItemTemplate, AvatarTemplate, t, style }) => {
	const title = roomTypes.getRoomName(room.t, room);
	const icon = <Sidebar.Item.Icon name={roomTypes.getIcon(room)}/>;
	const href = roomTypes.getRouteLink(room.t, room);

	const {
		lastMessage,
		unread,
		userMentions,
		groupMentions,
		tunread = [],
		rid,
		t: type,
		cl,
	} = room;

	const threadUnread = tunread.length > 0;
	const message = extended && lastMessage ? `${ lastMessage.u.name || lastMessage.u.username }: ${ lastMessage.msg }` : t('No_messages_yet');
	const variant = (userMentions && 'danger') || (threadUnread && 'primary') || (groupMentions && 'warning') || 'ghost';
	const badges = unread > 0 ? <Badge variant={ variant } flexShrink={0}>{unread}</Badge> : null;

	return <SideBarItemTemplate
		is='a'
		unread={unread}
		threadUnread={threadUnread}
		selected={selected}
		href={href}
		title={title}
		time={lastMessage?.ts}
		subtitle={message}
		icon={icon}
		style={style}
		badges={badges}
		avatar={AvatarTemplate && <AvatarTemplate {...room}/>}
		menu={<RoomMenu rid={rid} unread={!!unread.length} roomOpen={false} type={type} cl={cl} name={title}/>}
	/>;
}, function areEqual(prevProps, nextProps) {
	if (prevProps.extended !== nextProps.extended) {
		return false;
	}
	if (prevProps.selected !== nextProps.selected) {
		return false;
	}
	if (prevProps.SideBarItemTemplate !== nextProps.SideBarItemTemplate) {
		return false;
	}
	if (prevProps.AvatarTemplate !== nextProps.AvatarTemplate) {
		return false;
	}
	if (prevProps.t !== nextProps.t) {
		return;
	}
	if (prevProps.style.height !== nextProps.style.height) {
		return false;
	}

	if (prevProps.room.unread !== nextProps.room.unread) {
		return false;
	}

	if (prevProps.room.tunread !== nextProps.room.tunread) {
		return false;
	}

	if (prevProps.room.groupMentions !== nextProps.room.groupMentions) {
		return false;
	}

	if (prevProps.room.userMentions !== nextProps.room.userMentions) {
		return false;
	}

	return prevProps.room._updatedAt.getTime() === nextProps.room._updatedAt.getTime();
});
