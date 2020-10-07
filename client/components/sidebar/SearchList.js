import React, { useState, useMemo } from 'react';
import { Meteor } from 'meteor/meteor';
import { Sidebar, TextInput, Box, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback, useDebouncedValue, useStableArray, useResizeObserver, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import memoize from 'memoize-one';
import { css } from '@rocket.chat/css-in-js';
import { FixedSizeList as List } from 'react-window';
// import { NamedChunksPlugin } from 'webpack';

import { useTranslation } from '../../contexts/TranslationContext';
// import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
// import { useSession } from '../../contexts/SessionContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useMethodData } from '../../contexts/ServerContext';
import { roomTypes } from '../../../app/utils';
// import { usePermission } from '../../contexts/AuthorizationContext';
import { useUserPreference, useUserSubscriptions } from '../../contexts/UserContext';
// import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useChatRoomTemplate, useAvatarTemplate, itemSizeMap, SideBarItemTemplateWithData } from './Chats';

export const createItemData = memoize((items, t, SideBarItemTemplate, AvatarTemplate, useRealName) => ({
	items,
	t,
	SideBarItemTemplate,
	AvatarTemplate,
	useRealName,
}));

export const Row = React.memo(({ data, index, style }) => {
	const { items, t, SideBarItemTemplate, AvatarTemplate, useRealName } = data;
	const item = items[index];
	if (item.t === 'd' && !item.u) {
		return <UserItem useRealName={useRealName} style={style} t={t} item={item} SideBarItemTemplate={SideBarItemTemplate} AvatarTemplate={AvatarTemplate} />;
	}
	return <SideBarItemTemplateWithData style={style} t={t} room={item} SideBarItemTemplate={SideBarItemTemplate} AvatarTemplate={AvatarTemplate} />;
});

const UserItem = React.memo(({ item, style, t, SideBarItemTemplate, AvatarTemplate, useRealName }) => {
	const title = useRealName ? item.fname || item.name : item.name || item.fname;
	const icon = <Sidebar.Item.Icon name={roomTypes.getIcon(item)}/>;
	const href = roomTypes.getRouteLink(item.t, item);

	return <SideBarItemTemplate
		is='a'
		href={href}
		title={title}
		subtitle={t('No_messages_yet')}
		avatar={AvatarTemplate && <AvatarTemplate {...item}/>}
		icon={icon}
		style={style}
	/>;
});


const shortcut = (() => {
	if (!Meteor.Device.isDesktop()) {
		return '';
	}
	if (window.navigator.platform.toLowerCase().includes('mac')) {
		return '(\u2318+K)';
	}
	return '(\u2303+K)';
})();

const useSpotlight = (filterText = '', usernames) => {
	const expression = /(@|#)?(.*)/i;
	const [, mention, name] = filterText.match(expression);

	const searchForChannels = mention === '#';
	const searchForDMs = mention === '@';

	const type = useMemo(() => {
		if (searchForChannels) {
			return { users: false, rooms: true };
		}
		if (searchForDMs) {
			return { users: true, rooms: false };
		}
		return { users: true, rooms: true };
	}, [searchForChannels, searchForDMs]);
	const args = useMemo(() => [name, usernames, type], [type, name, usernames]);

	const [data = { users: [], rooms: [] }] = useMethodData('spotlight', args);

	return useMemo(() => {
		if (!data) {
			return { users: [], rooms: [] };
		}
		return data;
	}, [data]);
};

const useSearchItems = (filterText) => {
	const expression = /(@|#)?(.*)/i;
	const teste = filterText.match(expression);

	const [, type, name] = teste;
	const query = useMemo(() => {
		const filterRegex = new RegExp(RegExp.escape(name), 'i');

		return {
			$or: [
				{ name: filterRegex },
				{ fname: filterRegex },
			],
			...type && {
				t: type === '@' ? 'd' : { $ne: 'd' },
			},
		};
	}, [name, type]);

	const localRooms = useUserSubscriptions(query);

	const usernamesFromClient = useStableArray([...localRooms?.map(({ t, name }) => (t === 'd' ? name : null))].filter(Boolean));

	const spotlight = useSpotlight(filterText, usernamesFromClient);

	return useMemo(() => {
		let exactUser = null;
		let exactRoom = null;
		if (spotlight.users[0] && spotlight.users[0].username === name) {
			exactUser = spotlight.users.shift();
		}
		if (spotlight.rooms[0] && spotlight.rooms[0].username === name) {
			exactRoom = spotlight.rooms.shift();
		}

		const resultsFromServer = [];

		const roomFilter = (room) => !localRooms.find((item) => [item.rid, item._id].includes(room._id));
		const userMap = (user) => ({
			_id: user._id,
			t: 'd',
			name: user.username,
			fname: user.name,
			avatarETag: user.avatarETag,
		});

		resultsFromServer.push(...spotlight.users.map(userMap));
		resultsFromServer.push(...spotlight.rooms.filter(roomFilter));

		exactRoom = exactRoom ? [roomFilter(exactRoom)] : [];
		exactUser = exactUser ? [userMap(exactUser)] : [];
		return exactUser.concat(exactRoom, localRooms, resultsFromServer);
	}, [localRooms, name, spotlight]);
};

const useInput = (initial) => {
	const [value, setValue] = useState(initial);
	const onChange = useMutableCallback((e) => {
		setValue(e.currentTarget.value);
	});
	return { value, onChange };
};

const SearchList = React.forwardRef(function SearchList({ onClose }, ref) {
	const t = useTranslation();
	const filter = useInput('');

	const autofocus = useAutoFocus();

	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const sidebarHideAvatar = useUserPreference('sidebarHideAvatar');
	const showRealName = useSetting('UI_Use_Real_Name');
	const SideBarItemTemplate = useChatRoomTemplate(sidebarViewMode);
	const AvatarTemplate = useAvatarTemplate(sidebarHideAvatar, sidebarViewMode);
	const itemSize = itemSizeMap(sidebarViewMode);

	const filterText = useDebouncedValue(filter.value, 100);

	const placeholder = [t('Search'), shortcut].filter(Boolean).join(' ');

	const items = useSearchItems(filterText);

	const itemData = createItemData(items, t, SideBarItemTemplate, AvatarTemplate, showRealName);

	const { boxRef, contentBoxSize: { blockSize = 750 } = {} } = useResizeObserver({ debounceDelay: 100 });

	return <Box position='absolute' bg='neutral-200' h='full' zIndex={99} w='full' className={css`left: 0; top: 0;`} ref={ref}>
		<Sidebar.TopBar.Section>
			<TextInput ref={autofocus} {...filter} placeholder={placeholder} addon={<Icon name='cross' size='x20' onClick={onClose}/>}/>
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
