import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Sidebar, TextInput, Box, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback, useDebouncedValue, useStableArray, useSafely, useResizeObserver } from '@rocket.chat/fuselage-hooks';
import memoize from 'memoize-one';
import { css } from '@rocket.chat/css-in-js';
import { FixedSizeList as List } from 'react-window';

import { useTranslation } from '../../contexts/TranslationContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useSession } from '../../contexts/SessionContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useMethod } from '../../contexts/ServerContext';
import { roomTypes } from '../../../app/utils';
// import { usePermission } from '../../contexts/AuthorizationContext';
import { useUser, useUserPreference } from '../../contexts/UserContext';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { Rooms, Subscriptions } from '../../../app/models';
import { useChatRoomTemplate, useAvatarTemplate, itemSizeMap, SideBarItemTemplateWithData } from './Chats';

export const createItemData = memoize((items, extended, t, SideBarItemTemplate, AvatarTemplate, useRealName) => ({
	items,
	extended,
	t,
	SideBarItemTemplate,
	AvatarTemplate,
	useRealName,
}));

export const Row = React.memo(({ data, index, style }) => {
	const { extended, items, t, SideBarItemTemplate, AvatarTemplate, useRealName } = data;
	const item = items[index];
	if (typeof item === 'string') {
		return <Sidebar.Section.Title style={style}>{t(item)}</Sidebar.Section.Title>;
	}
	if (item.t === 'd' && !item.u) {
		return <UserItem useRealName={useRealName} style={style} t={t} item={item} extended={extended} SideBarItemTemplate={SideBarItemTemplate} AvatarTemplate={AvatarTemplate} />;
	}
	return <SideBarItemTemplateWithData style={style} t={t} room={item} extended={extended} SideBarItemTemplate={SideBarItemTemplate} AvatarTemplate={AvatarTemplate} />;
});

const UserItem = React.memo(({ item, style, extended, t, SideBarItemTemplate, AvatarTemplate, useRealName }) => {
	const title = useRealName ? item.fname || item.name : item.name || item.fname;
	const icon = <Sidebar.Item.Icon name={roomTypes.getIcon(item)}/>;
	const href = roomTypes.getRouteLink(item.t, item);

	return <SideBarItemTemplate
		is='a'
		href={href}
		title={title}
		subtitle={extended && t('No_messages_yet')}
		avatar={AvatarTemplate && <AvatarTemplate {...item}/>}
		icon={icon}
		style={style}
	/>;
});

const getSearchShortcut = () => {
	if (!Meteor.Device.isDesktop()) {
		return '';
	}
	if (window.navigator.platform.toLowerCase().includes('mac')) {
		return '(\u2318+K)';
	}
	return '(\u2303+K)';
};

const shortcut = getSearchShortcut();

const useSearch = (filterText = '') => {
	const [data, setData] = useSafely(useState());

	const dispatchToastMessage = useToastMessageDispatch();
	const openedRoom = useSession('openedRoom');
	const user = useUser();
	const userId = user._id;

	const collection = userId ? Subscriptions : Rooms;

	const spotlight = useMethod('spotlight');

	const firstChar = filterText.substring(1);

	const searchForChannels = firstChar === '#';
	const searchForDMs = firstChar === '@';

	let finalFilter = '';
	let roomType = '';

	if (searchForChannels || searchForDMs) {
		finalFilter = filterText.slice(1);
		roomType = searchForChannels ? 'c' : 'd';
	} else {
		finalFilter = filterText;
	}

	const type = useMemo(() => {
		if (searchForChannels) {
			return { users: false, rooms: true };
		}
		if (searchForDMs) {
			return { users: true, rooms: false };
		}
		return { users: true, rooms: true };
	}, [searchForChannels, searchForDMs]);

	const query = useMemo(() => {
		const filterRegex = new RegExp(RegExp.escape(finalFilter), 'i');
		const idKey = !userId ? '_id' : 'rid';

		return {
			$or: [
				{ name: filterRegex },
				{ fname: filterRegex },
			],
			[idKey]: {
				$ne: openedRoom,
			},
			...roomType && { t: roomType },
		};
	}, [finalFilter, openedRoom, roomType, userId]);

	const localItems = useReactiveValue(useCallback(() => collection.find(query, { limit: 20, sort: { unread: -1, ls: -1 } }).fetch(), [query, collection]));

	const usernamesFromClient = useStableArray([user?.username, ...localItems.map(({ t, name }) => (t === 'd' ? name : null))].filter(Boolean));

	const fetch = useCallback(async () => {
		try {
			const results = await spotlight(finalFilter, usernamesFromClient, type);
			let exactUser = null;
			let exactRoom = null;
			if (results.users[0] && results.users[0].username === finalFilter) {
				exactUser = results.users.shift();
			}
			if (results.rooms[0] && results.rooms[0].username === finalFilter) {
				exactRoom = results.rooms.shift();
			}

			const resultsFromServer = [];

			const roomFilter = (room) => !localItems.find((item) => [item.rid, item._id].includes(room._id));
			const userMap = (user) => ({
				_id: user._id,
				t: 'd',
				name: user.username,
				fname: user.name,
				avatarETag: user.avatarETag,
			});

			resultsFromServer.push(...results.users.map(userMap));
			resultsFromServer.push(...results.rooms.filter(roomFilter));

			if (resultsFromServer.length || exactUser || exactRoom) {
				exactRoom = exactRoom ? [roomFilter(exactRoom)] : [];
				exactUser = exactUser ? [userMap(exactUser)] : [];
				const combinedResults = exactUser.concat(exactRoom, localItems, resultsFromServer);
				setData(combinedResults);
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [spotlight, finalFilter, usernamesFromClient, type, localItems, setData, dispatchToastMessage]);

	useEffect(() => {
		fetch();
	}, [fetch]);

	return data;
};

const SearchList = React.forwardRef(function SearchList({ onClose }, ref) {
	const t = useTranslation();
	const [filter, setFilter] = useState();

	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const sidebarHideAvatar = useUserPreference('sidebarHideAvatar');
	const showRealName = useSetting('UI_Use_Real_Name');
	const SideBarItemTemplate = useChatRoomTemplate(sidebarViewMode);

	const AvatarTemplate = useAvatarTemplate(sidebarHideAvatar, sidebarViewMode);

	const extended = sidebarViewMode === 'extended';

	const itemSize = itemSizeMap(sidebarViewMode);

	const filterText = useDebouncedValue(filter, 400);

	const handleFilter = useMutableCallback((e) => {
		setFilter(e.currentTarget.value);
	});

	const placeholder = [t('Search'), shortcut].filter(Boolean).join(' ');

	const items = useSearch(filterText);

	const itemData = createItemData(items, extended, t, SideBarItemTemplate, AvatarTemplate, showRealName);

	const { boxRef, contentBoxSize: { blockSize = 750 } = {} } = useResizeObserver({ debounceDelay: 100 });

	return <Box position='absolute' bg='neutral-200' h='100vh' zIndex={99} w='full' className={[css`left: 0; top: 0;`]} ref={ref}>
		<Sidebar.TopBar.Section>
			<TextInput value={filter} onChange={handleFilter} placeholder={placeholder} addon={<Icon name='cross' size='x20' onClick={onClose}/>}/>
		</Sidebar.TopBar.Section>
		<Box h='full' w='full' ref={boxRef}>
			<List
				height={blockSize}
				itemCount={items?.length}
				itemSize={itemSize}
				itemData={itemData}
				overscanCount={25}
				width='100%'
			>
				{Row}
			</List>
		</Box>
	</Box>;
});

export default SearchList;
