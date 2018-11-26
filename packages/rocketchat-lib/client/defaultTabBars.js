import { Session } from 'meteor/session';

RocketChat.TabBar.addButton({
	groups: ['channel', 'group', 'direct'],
	id: 'rocket-search',
	i18nTitle: 'Search_Messages',
	icon: 'magnifier',
	template: 'RocketSearch',
	order: 1,
});

RocketChat.TabBar.addButton({
	groups: ['direct'],
	id: 'user-info',
	i18nTitle: 'User_Info',
	icon: 'user',
	template: 'membersList',
	order: 2,
});

RocketChat.TabBar.addButton({
	groups: ['channel', 'group'],
	id: 'members-list',
	i18nTitle: 'Members_List',
	icon: 'team',
	template: 'membersList',
	order: 2,
	condition() {
		const rid = Session.get('openedRoom');
		const room = RocketChat.models.Rooms.findOne({
			_id: rid,
		});

		if (!room || !room.broadcast) {
			return true;
		}

		return RocketChat.authz.hasAllPermission('view-broadcast-member-list', rid);
	},
});

RocketChat.TabBar.addButton({
	groups: ['channel', 'group'],
	id: 'addUsers',
	i18nTitle: 'Add_users',
	icon: 'user-plus',
	template: 'inviteUsers',
	order: 2,
});


RocketChat.TabBar.addButton({
	groups: ['channel', 'group', 'direct'],
	id: 'uploaded-files-list',
	i18nTitle: 'Room_uploaded_file_list',
	icon: 'clip',
	template: 'uploadedFilesList',
	order: 3,
});

RocketChat.TabBar.addButton({
	groups: ['channel', 'group', 'direct'],
	id: 'keyboard-shortcut-list',
	i18nTitle: 'Keyboard_Shortcuts_Title',
	icon: 'keyboard',
	template: 'keyboardShortcuts',
	order: 4,
});
