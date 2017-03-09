/**
 *	fills the righthandside flexTab-Bar with the relevant tools
 *	@see packages/rocketchat-livechat/client/ui.js
 *	@see packages/rocketchat-lib/client/defaultTabBars.js
 */

RocketChat.TabBar.addGroup('starred-messages', ['request', 'expertise']);
RocketChat.TabBar.addGroup('push-notifications', ['request', 'expertise']);

RocketChat.TabBar.addButton({
	groups: ['request', 'expertise'],
	id: 'external-search',
	i18nTitle: 'Knowledge_Base',
	icon: 'icon-lightbulb',
	template: 'dbsAI_externalSearch',
	order: 0
});

RocketChat.TabBar.addButton({
	groups: ['request', 'expertise'],
	id: 'channel-settings',
	i18nTitle: 'Room_Info',
	icon: 'icon-info-circled',
	template: 'channelSettings',
	order: 1
});

RocketChat.TabBar.addButton({
	groups: ['request', 'expertise'],
	id: 'members-list',
	i18nTitle: 'Members_List',
	icon: 'icon-users',
	template: 'membersList',
	order: 3
});

RocketChat.TabBar.addButton({
	groups: ['request', 'expertise'],
	id: 'message-search',
	i18nTitle: 'Search',
	icon: 'icon-search',
	template: 'messageSearch',
	order: 10
});

RocketChat.TabBar.addButton({
	groups: ['request', 'expertise'],
	id: 'uploaded-files-list',
	i18nTitle: 'Room_uploaded_file_list',
	icon: 'icon-attach',
	template: 'uploadedFilesList',
	order: 30
});
