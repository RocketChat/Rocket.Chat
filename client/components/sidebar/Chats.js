
import React, { useCallback } from 'react';
import { Sidebar, Box, Badge } from '@rocket.chat/fuselage';

import { ChatSubscription } from '../../../app/models';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useTranslation } from '../../contexts/TranslationContext';
import { useSetting } from '../../contexts/SettingsContext';
import { roomTypes } from '../../../app/utils';
import { useUser, useUserPreference } from '../../contexts/UserContext';
// import Condensed from './Condensed';
import Condensed from './Condensed';
import Medium from './Medium';
import Extended from './Extended';

const query = {};
const sort = {};

const useChatRoomTemplate = (viewMode) => useCallback(() => {
	if (viewMode === 'extended') {
		return Extended;
	}

	if (viewMode === 'medium') {
		return Medium;
	}

	return Condensed;
}, [viewMode]);

export default () => {
	const t = useTranslation();

	const user = useUser();
	const useRealName = useSetting('UI_Use_Real_Name');
	const viewMode = useUserPreference('sidebarViewMode');
	const hideAvatars = useUserPreference('hideAvatars');
	const hideUsernames = useUserPreference('hideUsernames');

	const ChatRoom = useChatRoomTemplate(viewMode);

	const rooms = useReactiveValue(useCallback(() => ChatSubscription.find(query, { sort }).fetch(), [query]));

	const favorite = new Set();
	const omnichannel = new Set();
	const unread = new Set();
	const _private = new Set();
	const _public = new Set();
	const direct = new Set();
	const discussion = new Set();

	rooms.forEach((room) => {
		if (room.alert && room.unread && !room.hideUnreadStatus) {
			unread.add(room);
		}

		if (room.drid) {
			discussion.add(room);
		}

		if (room.t === 'c') {
			_public.add(room);
		}

		if (room.t === 'p') {
			_private.add(room);
		}

		if (room.t === 'l') {
			omnichannel.add(room);
		}

		if (room.t === 'd') {
			direct.add(room);
		}

		if (room.f) {
			favorite.add(room);
		}
	});

	const groups = new Map();

	groups.set('Omnichannel', omnichannel);
	groups.set('Unread', unread);
	groups.set('Favorites', favorite);
	groups.set('Discussions', discussion);
	groups.set('Public', _public);
	groups.set('Private', _private);
	groups.set('Direct', direct);

	return [...groups.entries()].flatMap(([key, group]) => {
		if (group.size !== 0) {
			return [
				<Sidebar.Section.Title>{t(key)}</Sidebar.Section.Title>,
				[...group].map((room) => {
					// const rType = roomTypes.getConfig(room.t);
					const name = roomTypes.getRoomName(room.t, room);
					const icon = roomTypes.getIcon(room);

					const {
						lastMessage,
						unread,
						userMentions,
					} = room;

					// TODO: timestamp on extended mode
					const title = viewMode === 'extended'
						? name
						: name;

					const message = `${ lastMessage.u.name || lastMessage.u.username }: ${ lastMessage.msg }`;

					const subtitle = viewMode === 'extended'
						? <Box display='flex' flexDirection='row' w='full' alignItems='center'>
							<Box flexGrow='1' withTruncatedText>{message}</Box>
							{unread && <Badge bg={!userMentions && 'neutral-700'} primary flexShrink={0}>{unread}</Badge>}
						</Box>
						: `${ name }`;

					return <ChatRoom
						title={title}
						subtitle={subtitle}
						icon={<Sidebar.Title.Icon name={icon}/>}
					/>;
				})];
		}
		return null;
	}).filter(Boolean);
};
