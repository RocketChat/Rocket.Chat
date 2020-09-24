
import { Sidebar, Box, Badge, Scrollable } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';

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

const query = {};

const useChatRoomTemplate = (sidebarViewMode) => useMemo(() => {
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

const itemSizeMap = (sidebarViewMode) => {
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

export default () => {
	const t = useTranslation();

	const sortBy = useUserPreference('sidebarSortby');
	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const sidebarHideAvatar = useUserPreference('sidebarHideAvatar');
	const favoritesEnabled = useUserPreference('sidebarShowFavorites');
	const showDiscussion = useUserPreference('sidebarShowDiscussion');
	const sidebarShowUnread = useUserPreference('sidebarShowUnread');
	const showRealName = useSetting('UI_Use_Real_Name');
	const SideBarItemTemplate = useChatRoomTemplate(sidebarViewMode);

	const omnichannelEnabled = useSetting('Livechat_enabled');
	const showOmnichannel = usePermission('view-l-room') && omnichannelEnabled;

	const AvatarTemplate = useMemo(() => {
		if (sidebarHideAvatar) {
			return () => null;
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

			if (showOmnichannel && room.t === 'l') {
				omnichannel.add(room);
			}

			if (room.t === 'd') {
				direct.add(room);
			}
		});

		const groups = new Map();

		favoritesEnabled && groups.set('Favorites', favorite);
		sidebarShowUnread && groups.set('Unread', unread);
		groups.set('Omnichannel', omnichannel);
		groups.set('Private', _private);
		groups.set('Public', _public);
		groups.set('Direct', direct);
		showDiscussion && groups.set('Discussions', discussion);
		return groups;
	}, [favoritesEnabled, rooms, showDiscussion, sidebarShowUnread, showOmnichannel]);


	const extended = sidebarViewMode === 'extended';

	const items = [...groups.entries()].reduce((acc, [key, group]) => {
		if (group.size === 0) {
			return acc;
		}
		acc = [...acc, key, ...group];
		return acc;
	}, []);

	const { ref, contentBoxSize: { blockSize = 750 } = {} } = useResizeObserver({ debounceDelay: 100 });

	const listRef = useRef();

	const itemSize = itemSizeMap(sidebarViewMode);

	useEffect(() => {
		listRef.current && listRef.current.resetAfterIndex(0);
	}, [itemSize]);

	return <Box h='full' w='full' ref={ref}>
		<List
			height={blockSize}
			estimatedItemSize={itemSize}
			itemCount={items.length}
			itemSize={(index) => (typeof items[index] === 'string' ? 40 : itemSize)}
			itemData={items}
			overscanCount={3}
			width='100%'
			ref={listRef}
		>
			{({ data, index, style }) => {
				if (typeof data[index] === 'string') {
					return <Sidebar.Section.Title key={data[index]} style={style}>{t(data[index])}</Sidebar.Section.Title>;
				}
				const room = data[index];
				return <SideBarItemTemplateWithData style={style} key={room._id} t={t} room={room} extended={extended} SideBarItemTemplate={SideBarItemTemplate} AvatarTemplate={AvatarTemplate} />;
			}}
		</List>
	</Box>;

	// return <Scrollable vertical smooth><Box>{[...groups.entries()].flatMap(([key, group]) => {
	// 	if (group.size === 0) {
	// 		return null;
	// 	}
	// 	return [
	// 		<Sidebar.Section.Title key={key}>{t(key)}</Sidebar.Section.Title>,
	// 		[...group].map((room) => <SideBarItemTemplateWithData key={room._id} t={t} room={room} extended={extended} SideBarItemTemplate={SideBarItemTemplate} AvatarTemplate={AvatarTemplate} />)];
	// })}</Box></Scrollable>;
};

const SideBarItemTemplateWithData = React.memo(({ room, extended, SideBarItemTemplate, AvatarTemplate, t, style }) => {
// const rType = roomTypes.getConfig(room.t);
	const title = roomTypes.getRoomName(room.t, room);
	const icon = <Sidebar.Item.Icon name={roomTypes.getIcon(room)}/>;
	const href = roomTypes.getRouteLink(room.t, room);

	const {
		lastMessage,
		unread,
		userMentions,
	} = room;

	const message = extended && lastMessage ? `${ lastMessage.u.name || lastMessage.u.username }: ${ lastMessage.msg }` : t('No_messages_yet');

	const subtitle = extended && <Box display='flex' flexDirection='row' w='full' alignItems='center'>
		<Box flexGrow='1' withTruncatedText>{message}</Box>
		{unread > 0 && <Badge bg={!userMentions && 'neutral-700'} primary flexShrink={0}>{unread}</Badge>}
	</Box>;

	return <SideBarItemTemplate
		is='a'
		href={href}
		title={title}
		time={lastMessage?.ts}
		subtitle={subtitle}
		icon={icon}
		style={style}
		avatar={<AvatarTemplate {...room}/>}
	/>;
}, function areEqual(prevProps, nextProps) {
	if (prevProps.extended !== nextProps.extended) {
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

	return prevProps.room._updatedAt.getTime() === nextProps.room._updatedAt.getTime();
});
