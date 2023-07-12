import { usePermission } from '@rocket.chat/ui-contexts';
import { useMemo, lazy } from 'react';

import { ui } from '../../../../lib/ui';

ui.addRoomAction('rocket-search', {
	groups: ['channel', 'group', 'direct', 'direct_multiple', 'live', 'team'],
	id: 'rocket-search',
	title: 'Search_Messages',
	icon: 'magnifier',
	template: lazy(() => import('../../contextualBar/MessageSearchTab')),
	order: 6,
});

ui.addRoomAction('user-info', {
	groups: ['direct'],
	id: 'user-info',
	title: 'User_Info',
	icon: 'user',
	template: lazy(() => import('../../MemberListRouter')),
	order: 1,
});

ui.addRoomAction('contact-profile', {
	groups: ['live' /* , 'voip'*/],
	id: 'contact-profile',
	title: 'Contact_Info',
	icon: 'user',
	template: lazy(() => import('../../../omnichannel/directory/contacts/contextualBar/ContactsContextualBar')),
	order: 1,
});

ui.addRoomAction('user-info-group', {
	groups: ['direct_multiple'],
	id: 'user-info-group',
	title: 'Members',
	icon: 'members',
	template: lazy(() => import('../../MemberListRouter')),
	order: 1,
});

ui.addRoomAction('members-list', ({ room }) => {
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

ui.addRoomAction('uploaded-files-list', {
	groups: ['channel', 'group', 'direct', 'direct_multiple', 'live', 'team'],
	id: 'uploaded-files-list',
	title: 'Files',
	icon: 'clip',
	template: lazy(() => import('../../contextualBar/RoomFiles')),
	order: 7,
});

ui.addRoomAction('keyboard-shortcut-list', {
	groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
	id: 'keyboard-shortcut-list',
	title: 'Keyboard_Shortcuts_Title',
	icon: 'keyboard',
	template: lazy(() => import('../../contextualBar/KeyboardShortcuts')),
	order: 99,
});
