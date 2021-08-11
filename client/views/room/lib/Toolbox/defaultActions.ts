import { useMemo, lazy } from 'react';

import { addAction } from '.';
import { usePermission } from '../../../../contexts/AuthorizationContext';

addAction('rocket-search', {
	groups: ['channel', 'group', 'direct', 'direct_multiple', 'live', 'team', 'ephemeral'],
	id: 'rocket-search',
	title: 'Search_Messages',
	icon: 'magnifier',
	template: 'RocketSearch',
	order: 6,
});

addAction('user-info', {
	groups: ['direct'],
	id: 'user-info',
	title: 'User_Info',
	icon: 'user',
	template: lazy(() => import('../../MemberListRouter')),
	order: 1,
});

addAction('contact-profile', {
	groups: ['live'],
	id: 'contact-profile',
	title: 'Contact_Info',
	icon: 'user',
	template: lazy(
		() => import('../../../omnichannel/directory/contacts/contextualBar/ContactsContextualBar'),
	),
	order: 1,
});

addAction('user-info-group', {
	groups: ['direct_multiple'],
	id: 'user-info-group',
	title: 'Members',
	icon: 'team',
	template: lazy(() => import('../../MemberListRouter')),
	order: 1,
});

addAction('members-list', ({ room }) => {
	const hasPermission = usePermission('view-broadcast-member-list', room._id);
	return useMemo(
		() =>
			!room.broadcast || hasPermission
				? {
						groups: ['channel', 'group', 'team', 'ephemeral'],
						id: 'members-list',
						title: room.teamMain ? 'Teams_members' : 'Members',
						icon: 'members',
						template: lazy(() => import('../../MemberListRouter')),
						order: 5,
				  }
				: null,
		[hasPermission, room.broadcast, room.teamMain],
	);
});

addAction('uploaded-files-list', {
	groups: ['channel', 'group', 'direct', 'direct_multiple', 'live', 'team', 'ephemeral'],
	id: 'uploaded-files-list',
	title: 'Files',
	icon: 'clip',
	template: lazy(() => import('../../contextualBar/RoomFiles')),
	order: 7,
});

addAction('ephemeral-time', ({ room }) => {
	const hasPermission = usePermission('edit-ephemeral-room', room._id);
	return useMemo(
		() =>
			room.t === 'e' && hasPermission
				? {
						groups: ['ephemeral'],
						id: 'ephemeral-time',
						title: 'Ephemeral_time',
						icon: 'clock',
						template: lazy(() => import('../../contextualBar/EphemeralTime')),
						order: 5,
				  }
				: null,
		[room.t, hasPermission],
	);
});

addAction('keyboard-shortcut-list', {
	groups: ['channel', 'group', 'direct', 'direct_multiple', 'team', 'ephemeral'],
	id: 'keyboard-shortcut-list',
	title: 'Keyboard_Shortcuts_Title',
	icon: 'keyboard',
	template: lazy(() => import('../../contextualBar/KeyboardShortcuts')),
	order: 99,
});
