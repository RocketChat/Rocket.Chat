import React, { useState, useMemo, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Sidebar, TextInput, Box, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback, useDebouncedValue, useSafely, useResizeObserver, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import memoize from 'memoize-one';
import { css } from '@rocket.chat/css-in-js';
import { FixedSizeList as List } from 'react-window';

import { useTranslation } from '../../contexts/TranslationContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useSession } from '../../contexts/SessionContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useMethod, useMethodData, AsyncState } from '../../contexts/ServerContext';
import { roomTypes } from '../../../app/utils';
// import { usePermission } from '../../contexts/AuthorizationContext';
import { useUser, useUserPreference, useUserSubscriptions } from '../../contexts/UserContext';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { Rooms, Subscriptions } from '../../../app/models';
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

const useSearch = (filterText = '') => {
	const dispatchToastMessage = useToastMessageDispatch();

	const user = useUser();
	const userId = user._id;

	const expression = /(@|#)?(.*)/i;
	const [, mention, name] = filterText.match(expression);


	// const collection = userId ? Subscriptions : Rooms;

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

	const args = useMemo(() => [name, [], type], [type, name]);

	const [data = { users: [], rooms: [] }] = useMethodData('spotlight', args);

	return useMemo(() => {
		if (!data) {
			return [];
		}
		return [...data.users, ...data.rooms];
	}, [data]);
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


	const query = useMemo(() => {
		const expression = /(@|#)?(.*)/i;
		const [, type, name] = filter.value.match(expression);
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
	}, [filter.value]);

	const localRooms = useUserSubscriptions(query);

	const filterText = useDebouncedValue(filter.value, 100);

	const placeholder = [t('Search'), shortcut].filter(Boolean).join(' ');

	const items = useSearch(filterText);

	console.log(items);

	const itemData = createItemData(localRooms, t, SideBarItemTemplate, AvatarTemplate, showRealName);

	const { boxRef, contentBoxSize: { blockSize = 750 } = {} } = useResizeObserver({ debounceDelay: 100 });

	return <Box position='absolute' bg='neutral-200' h='full' zIndex={99} w='full' className={css`left: 0; top: 0;`} ref={ref}>
		<Sidebar.TopBar.Section>
			<TextInput ref={autofocus} {...filter} placeholder={placeholder} addon={<Icon name='cross' size='x20' onClick={onClose}/>}/>
		</Sidebar.TopBar.Section>
		<Box h='full' w='full' ref={boxRef}>
			<List
				height={blockSize}
				itemCount={localRooms?.length}
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
