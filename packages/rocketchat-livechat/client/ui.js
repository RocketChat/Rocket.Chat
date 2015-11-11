Meteor.startup(function() {
	RocketChat.roomTypes.addType('livechat', ['livechat-agent', 'livechat-manager']);
	RocketChat.roomTypes.setIcon('l', 'icon-chat-empty');
	RocketChat.roomTypes.setRoute('l', 'live', function(sub) {
		return { name: sub.name };
	});

	AccountBox.addOption({ name: 'Livechat', icon: 'icon-chat-empty', class: 'livechat-manager', roles: ['livechat-manager'] });
});
