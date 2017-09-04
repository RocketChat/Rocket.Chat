Meteor.startup(function() {
	RocketChat.ChannelSettings.addOption({
		group: ['room'],
		id: 'tokenly',
		template: 'channelSettings__tokenly',
		validation() {
			return true;
		}
	});
});
