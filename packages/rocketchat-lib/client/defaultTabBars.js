RocketChat.TabBar.addButton({
	groups: ['channel', 'privategroup', 'directmessage'],
	id: 'message-search',
	i18nTitle: 'Search',
	icon: 'octicon octicon-search',
	template: 'messageSearch',
	order: 1
});

RocketChat.TabBar.addButton({
	groups: ['directmessage'],
	id: 'user-info',
	i18nTitle: 'User_Info',
	icon: 'octicon octicon-person',
	template: 'membersList',
	order: 2
});

RocketChat.TabBar.addButton({
	groups: ['channel', 'privategroup'],
	id: 'members-list',
	i18nTitle: 'Members_List',
	icon: 'octicon octicon-organization',
	template: 'membersList',
	order: 2
});

RocketChat.TabBar.addButton({
	groups: ['channel', 'privategroup', 'directmessage'],
	id: 'uploaded-files-list',
	i18nTitle: 'Room_uploaded_file_list',
	icon: 'octicon octicon-file-symlink-directory',
	template: 'uploadedFilesList',
	order: 3
});
