
import React, { useCallback } from 'react';
import { Sidebar } from '@rocket.chat/fuselage';

import { ChatSubscription } from '../../../app/models';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useTranslation } from '../../contexts/TranslationContext';
import Condensed from './Condensed';

const query = {};
const sort = {};

export default () => {
	const t = useTranslation();

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

	groups.set('Favorites', favorite);
	groups.set('Unread', unread);
	groups.set('Omnichannel', omnichannel);
	groups.set('Private', _private);
	groups.set('Public', _public);
	groups.set('Direct', direct);
	groups.set('Discussions', discussion);

	return [...groups.entries()].flatMap(([key, group]) => [<Sidebar.Section.Title>{t(key)}</Sidebar.Section.Title>, [...group].map((item) => <Condensed title={item.name || item.fname} titleIcon={<Sidebar.Item.Icon name='lock' />}/>)]);
};
