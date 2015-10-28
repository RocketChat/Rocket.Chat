Meteor.startup(function() {
	RocketChat.settings.addGroup('Livechat');
	RocketChat.settings.add('Livechat_title'       , 'Rocket.Chat', { type: 'string', group: 'Livechat', public: true });
	RocketChat.settings.add('Livechat_title_color' , '#C1272D',     { type: 'string', group: 'Livechat', public: true });
});
