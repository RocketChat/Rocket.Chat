import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Meteor } from 'meteor/meteor';
import { Sidebar, TextInput, Box, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback, useDebouncedValue, useStableArray, useResizeObserver, useAutoFocus, useUniqueId } from '@rocket.chat/fuselage-hooks';
import memoize from 'memoize-one';
import { css } from '@rocket.chat/css-in-js';
import { FixedSizeList as List } from 'react-window';
import tinykeys from 'tinykeys';

import { ReactiveUserStatus } from '../../components/UserStatus';
import { useTranslation } from '../../contexts/TranslationContext';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useSetting } from '../../contexts/SettingsContext';
import { roomTypes } from '../../../app/utils';
import { useUserPreference, useUserSubscriptions } from '../../contexts/UserContext';
import { itemSizeMap, SideBarItemTemplateWithData } from '../RoomList';
import { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';
import { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { escapeRegExp } from '../../../lib/escapeRegExp';
import { useMethodData } from '../../hooks/useMethodData';
import { AsyncStatePhase } from '../../hooks/useAsyncState';
import ScrollableContentWrapper from '../../components/ScrollableContentWrapper';

const createItemData = memoize((items, t, SideBarItemTemplate, AvatarTemplate, useRealName, extended, sidebarViewMode) => ({
	items,
	t,
	SideBarItemTemplate,
	AvatarTemplate,
	useRealName,
	extended,
	sidebarViewMode,
}));

const Row = React.memo(({ data, index, style }) => {
	const { items, t, SideBarItemTemplate, AvatarTemplate, useRealName, extended } = data;
	const item = items[index];
	if (item.t === 'd' && !item.u) {
		return <UserItem id={`search-${ item._id }`} useRealName={useRealName} style={style} t={t} item={item} SideBarItemTemplate={SideBarItemTemplate} AvatarTemplate={AvatarTemplate} />;
	}
	return <SideBarItemTemplateWithData id={`search-${ item._id }`} tabIndex={-1} extended={extended} style={style} t={t} room={item} SideBarItemTemplate={SideBarItemTemplate} AvatarTemplate={AvatarTemplate} />;
});

const UserItem = React.memo(({ item, id, style, t, SideBarItemTemplate, AvatarTemplate, useRealName, sidebarViewMode }) => {
	const title = useRealName ? item.fname || item.name : item.name || item.fname;
	const small = sidebarViewMode !== 'medium';
	const icon = <Sidebar.Item.Icon><ReactiveUserStatus small={small && 'small'} uid={item._id} /></Sidebar.Item.Icon>;
	const href = roomTypes.getRouteLink(item.t, item);

	return <SideBarItemTemplate
		is='a'
		id={id}
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

	const { value: data = { users: [], rooms: [] }, phase: status } = useMethodData('spotlight', args);

	return useMemo(() => {
		if (!data) {
			return { data: { users: [], rooms: [] }, status: 'loading' };
		}
		return { data, status };
	}, [data, status]);
};

const options = {
	sort: {
		lm: -1,
		name: 1,
	},
};

const useSearchItems = (filterText) => {
	const expression = /(@|#)?(.*)/i;
	const teste = filterText.match(expression);

	const [, type, name] = teste;
	const query = useMemo(() => {
		const filterRegex = new RegExp(escapeRegExp(name), 'i');

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

	const localRooms = useUserSubscriptions(query, options);

	const usernamesFromClient = useStableArray([...localRooms?.map(({ t, name }) => (t === 'd' ? name : null))].filter(Boolean));

	const { data: spotlight, status } = useSpotlight(filterText, usernamesFromClient);

	return useMemo(() => {
		const resultsFromServer = [];

		const filterUsersUnique = ({ _id }, index, arr) => index === arr.findIndex((user) => _id === user._id);
		const roomFilter = (room) => !localRooms.find((item) => (room.t === 'd' && room.uids.length > 1 && room.uids.includes(item._id)) || [item.rid, item._id].includes(room._id));
		const usersfilter = (user) => !localRooms.find((room) => room.t !== 'd' || (room.uids.length === 2 && room.uids.includes(user._id)));

		const userMap = (user) => ({
			_id: user._id,
			t: 'd',
			name: user.username,
			fname: user.name,
			avatarETag: user.avatarETag,
		});

		const exact = resultsFromServer.filter((item) => [item.usernamame, item.name, item.fname].includes(name));

		resultsFromServer.push(...spotlight.users.filter(filterUsersUnique).filter(usersfilter).map(userMap));
		resultsFromServer.push(...spotlight.rooms.filter(roomFilter));

		return { data: Array.from(new Set([...exact, ...localRooms, ...resultsFromServer])), status };
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [localRooms, name, spotlight]);
};

const useInput = (initial) => {
	const [value, setValue] = useState(initial);
	const onChange = useMutableCallback((e) => {
		setValue(e.currentTarget.value);
	});
	return { value, onChange, setValue };
};

const toggleSelectionState = (next, current, input) => {
	input.setAttribute('aria-activedescendant', next.id);
	next.setAttribute('aria-selected', true);
	next.classList.add('rcx-sidebar-item--selected');
	if (current) {
		current.setAttribute('aria-selected', false);
		current.classList.remove('rcx-sidebar-item--selected');
	}
};

const SearchList = React.forwardRef(function SearchList({ onClose }, ref) {
	const listId = useUniqueId();
	const t = useTranslation();
	const { setValue: setFilterValue, ...filter } = useInput('');

	const autofocus = useAutoFocus();

	const listRef = useRef();

	const selectedElement = useRef();
	const itemIndexRef = useRef(0);

	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const showRealName = useSetting('UI_Use_Real_Name');

	const sideBarItemTemplate = useTemplateByViewMode();
	const avatarTemplate = useAvatarTemplate();

	const itemSize = itemSizeMap(sidebarViewMode);

	const extended = sidebarViewMode === 'extended';

	const filterText = useDebouncedValue(filter.value, 100);

	const placeholder = [t('Search'), shortcut].filter(Boolean).join(' ');

	const { data: items, status } = useSearchItems(filterText);

	const itemData = createItemData(items, t, sideBarItemTemplate, avatarTemplate, showRealName, extended, sidebarViewMode);

	const { ref: boxRef, contentBoxSize: { blockSize = 750 } = {} } = useResizeObserver({ debounceDelay: 100 });

	usePreventDefault(boxRef);

	const changeSelection = useMutableCallback((dir) => {
		let nextSelectedElement = null;

		if (dir === 'up') {
			nextSelectedElement = selectedElement.current.previousSibling;
		} else {
			nextSelectedElement = selectedElement.current.nextSibling;
		}

		if (nextSelectedElement) {
			toggleSelectionState(nextSelectedElement, selectedElement.current, autofocus.current);
			return nextSelectedElement;
		}
		return selectedElement.current;
	});

	const resetCursor = useMutableCallback(() => {
		itemIndexRef.current = 0;
		listRef.current.scrollToItem(itemIndexRef.current);
		selectedElement.current = boxRef.current.querySelector('a.rcx-sidebar-item');
		if (selectedElement.current) {
			toggleSelectionState(selectedElement.current, undefined, autofocus.current);
		}
	});

	useEffect(() => {
		resetCursor();
	}, [filterText, resetCursor]);

	useEffect(() => {
		if (!autofocus.current) {
			return;
		}
		const unsubscribe = tinykeys(autofocus.current, {
			Escape: (event) => {
				event.preventDefault();
				setFilterValue((value) => {
					if (!value) {
						onClose();
					}
					resetCursor();
					return '';
				});
			},
			Tab: onClose,
			ArrowUp: () => {
				itemIndexRef.current = Math.max(itemIndexRef.current - 1, 0);
				listRef.current.scrollToItem(itemIndexRef.current);
				const currentElement = changeSelection('up');
				selectedElement.current = currentElement;
			},
			ArrowDown: () => {
				const currentElement = changeSelection('down');
				selectedElement.current = currentElement;
				itemIndexRef.current = Math.min(itemIndexRef.current + 1, items?.length + 1);
				listRef.current.scrollToItem(itemIndexRef.current);
			},
			Enter: () => {
				if (selectedElement.current) {
					selectedElement.current.click();
				}
			},
		});
		return () => {
			unsubscribe();
		};
	}, [autofocus, changeSelection, items.length, onClose, resetCursor, setFilterValue]);

	return <Box position='absolute' rcx-sidebar h='full' display='flex' flexDirection='column' zIndex={99} w='full' className={css`left: 0; top: 0;`} ref={ref}>
		<Sidebar.TopBar.Section role='search' is='form'>
			<TextInput aria-owns={listId} data-qa='sidebar-search-input' ref={autofocus} {...filter} placeholder={placeholder} addon={<Icon name='cross' size='x20' onClick={onClose}/>}/>
		</Sidebar.TopBar.Section>
		<Box aria-expanded='true' role='listbox' id={listId} tabIndex={-1} flexShrink={1} h='full' w='full' ref={boxRef} data-qa='sidebar-search-result' onClick={onClose} aria-busy={status !== AsyncStatePhase.RESOLVED}>
			<List
				outerElementType={ScrollableContentWrapper}
				height={blockSize}
				itemCount={items?.length}
				itemSize={itemSize}
				itemData={itemData}
				overscanCount={25}
				width='100%'
				ref={listRef}
			>
				{Row}
			</List>
		</Box>
	</Box>;
});

export default SearchList;
