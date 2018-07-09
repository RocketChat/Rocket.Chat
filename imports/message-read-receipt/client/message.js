import { Template } from 'meteor/templating';

Template.message.helpers({
	readReceipt() {
		if (!RocketChat.settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}

		return {
			readByEveryone: (!this.unread && 'read') || 'color-component-color'
		};
	}
});
