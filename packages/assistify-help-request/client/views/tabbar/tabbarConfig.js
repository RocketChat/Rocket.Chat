/**
 *	fills the righthandside flexTab-Bar with the relevant tools
 *	@see packages/rocketchat-livechat/client/ui.js
 *	@see packages/rocketchat-lib/client/defaultTabBars.js
 */

RocketChat.TabBar.addGroup('starred-messages', ['request', 'expertise']);
RocketChat.TabBar.addGroup('push-notifications', ['request', 'expertise']);
RocketChat.TabBar.addGroup('channel-settings', ['request', 'expertise']);
RocketChat.TabBar.addGroup('members-list', ['request', 'expertise']);
RocketChat.TabBar.addGroup('message-search', ['request', 'expertise']);
RocketChat.TabBar.addGroup('uploaded-files-list', ['request', 'expertise']);

RocketChat.TabBar.addButton({
	groups: ['request', 'expertise', 'live'],
	id: 'AssistifyAi',
	i18nTitle: 'Knowledge_Base',
	icon: 'lightbulb',
	template: 'AssistifySmarti',
	order: 0
});
