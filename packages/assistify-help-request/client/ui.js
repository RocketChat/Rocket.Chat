/**
 *	fills the righthandside flexTab-Bar with the relevant tools
 *	@see packages/rocketchat-livechat/client/ui.js
 *	@see packages/rocketchat-lib/client/defaultTabBars.js
 */

RocketChat.TabBar.addGroup('starred-messages', ['request', 'experts']);
RocketChat.TabBar.addGroup('push-notifications', ['request', 'experts']);

RocketChat.TabBar.addButton({
	groups: ['request', 'experts'],
	id: 'external-search',
	i18nTitle: 'Knowledge_Base',
	icon: 'icon-lightbulb',
	template: 'dbsAI_externalSearch',
	order: 0
});

RocketChat.TabBar.addButton({
	groups: ['request', 'experts'],
	id: 'message-search',
	i18nTitle: 'Search',
	icon: 'icon-search',
	template: 'messageSearch',
	order: 10
});
RocketChat.TabBar.addButton({
	groups: ['request', 'experts'],
	id: 'members-list',
	i18nTitle: 'Members_List',
	icon: 'icon-users',
	template: 'membersList',
	order: 20
});

RocketChat.TabBar.addButton({
	groups: ['request', 'experts'],
	id: 'uploaded-files-list',
	i18nTitle: 'Room_uploaded_file_list',
	icon: 'icon-attach',
	template: 'uploadedFilesList',
	order: 30
});
