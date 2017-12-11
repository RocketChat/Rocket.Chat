import resetSelection from '../resetSelection';

Template.channelSettingsMailMessages.helpers({
	canSendEmail() {
		return FlowRouter.getRouteName() !== 'admin-rooms';
	}
});

Template.channelSettingsMailMessages.events({
	'click button.mail-messages'() {
		Session.set('channelSettingsMailMessages', Session.get('openedRoom'));
		this.tabBar.setTemplate('mailMessagesInstructions');
		resetSelection(true);
	}
});

Template.channelSettingsMailMessages.onCreated(() =>resetSelection(false));
