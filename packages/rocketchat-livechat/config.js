Meteor.startup(function() {
	RocketChat.settings.addGroup('Livechat');
	RocketChat.settings.add('Livechat_title'       , 'Rocket.Chat', { type: 'string', group: 'Livechat', i18nLabel: 'rocketchat-livechat:Livechat_title',       public: true });
	RocketChat.settings.add('Livechat_title_color' , '#C1272D',     { type: 'string', group: 'Livechat', i18nLabel: 'rocketchat-livechat:Livechat_title_color', public: true });
});
