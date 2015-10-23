Meteor.startup(function() {
	RocketChat.roomTypes.addType('livechat', ['livechat-agent', 'livechat-manager']);
	RocketChat.roomTypes.setRoute('l', 'live', function(sub) {
		console.log('livechat route ->',sub);
		return { name: sub.name };
	});

	AccountBox.addOption({ name: 'Livechat', icon: 'icon-chat-empty', class: 'livechat-manager', roles: ['livechat-manager'] });
});
