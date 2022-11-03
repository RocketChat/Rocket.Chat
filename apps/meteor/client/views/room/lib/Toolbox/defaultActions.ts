import { usePermission } from '@rocket.chat/ui-contexts';
import { useMemo, lazy } from 'react';

import { addAction } from '.';

addAction('rocket-search', {
	groups: ['channel', 'group', 'direct', 'direct_multiple', 'live', 'team'],
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
	groups: ['live' /* , 'voip'*/],
	id: 'contact-profile',
	title: 'Contact_Info',
	icon: 'user',
	template: lazy(() => import('../../../omnichannel/directory/contacts/contextualBar/ContactsContextualBar')),
	order: 1,
});

addAction('user-info-group', {
	groups: ['direct_multiple'],
	id: 'user-info-group',
	title: 'Members',
	icon: 'members',
	template: lazy(() => import('../../MemberListRouter')),
	order: 1,
});

addAction('members-list', ({ room }) => {
	const hasPermission = usePermission('view-broadcast-member-list', room._id);
	return useMemo(
		() =>
			!room.broadcast || hasPermission
				? {
						groups: ['channel', 'group', 'team'],
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
	groups: ['channel', 'group', 'direct', 'direct_multiple', 'live', 'team'],
	id: 'uploaded-files-list',
	title: 'Files',
	icon: 'clip',
	template: lazy(() => import('../../contextualBar/RoomFiles')),
	order: 7,
});

addAction('keyboard-shortcut-list', {
	groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
	id: 'keyboard-shortcut-list',
	title: 'Keyboard_Shortcuts_Title',
	icon: 'keyboard',
	template: lazy(() => import('../../contextualBar/KeyboardShortcuts')),
	order: 99,
});
