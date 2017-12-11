import resetSelection from '../resetSelection';
Meteor.startup(() => {
	RocketChat.ChannelSettings.addOption({
		group: ['room'],
		id: 'mail-messages',
		template: 'channelSettingsMailMessages',
		validation() {
			return RocketChat.authz.hasAllPermission('mail-messages');
		}
	});
	RocketChat.callbacks.add('roomExit', () => resetSelection(false), RocketChat.callbacks.priority.MEDIUM, 'room-exit-mail-messages');
});
