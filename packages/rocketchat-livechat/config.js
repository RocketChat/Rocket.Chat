Meteor.startup(function() {
	RocketChat.settings.addGroup('Livechat');
	RocketChat.settings.add('Livechat_title'       , 'Rocket.Chat', { type: 'string', group: 'Livechat', public: true });
	RocketChat.settings.add('Livechat_title_color' , '#C1272D',     { type: 'string', group: 'Livechat', public: true });
	RocketChat.settings.add('Livechat_enabled' ,     false,         { type: 'boolean', group: 'Livechat', public: true });
	RocketChat.settings.add('Livechat_registration_form' , true,    { type: 'boolean', group: 'Livechat', public: true, i18nLabel: 'Show_preregistration_form' });
	RocketChat.settings.add('Livechat_guest_count' , 1,             { type: 'int', group: 'Livechat' });
});
