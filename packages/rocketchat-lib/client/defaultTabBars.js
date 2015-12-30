RocketChat.TabBar.addButton({
	groups: ['channel', 'privategroup', 'directmessage'],
	id: 'message-search',
	i18nTitle: TAPi18n.__('Search'),
	icon: 'octicon octicon-search',
	template: 'messageSearch',
	order: 1
});

RocketChat.TabBar.addButton({
	groups: ['directmessage'],
	id: 'members-list',
	i18nTitle: TAPi18n.__('User_Info'),
	icon: 'octicon octicon-person',
	template: 'membersList',
	order: 2
});

RocketChat.TabBar.addButton({
	groups: ['channel', 'privategroup'],
	id: 'members-list',
	i18nTitle: TAPi18n.__('Members_List'),
	icon: 'octicon octicon-organization',
	template: 'membersList',
	order: 2
});

RocketChat.TabBar.addButton({
	groups: ['channel', 'privategroup', 'directmessage'],
	id: 'uploaded-files-list',
	i18nTitle: TAPi18n.__('Room_uploaded_file_list'),
	icon: 'octicon octicon-file-symlink-directory',
	template: 'uploadedFilesList',
	order: 3
});
