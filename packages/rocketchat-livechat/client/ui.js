Meteor.startup(function() {
	RocketChat.roomTypes.add('livechat', ['livechat-agent', 'livechat-manager']);
	AccountBox.addOption({ name: 'Livechat', icon: 'icon-chat-empty', class: 'livechat-manager', roles: ['livechat-manager'] });
});
