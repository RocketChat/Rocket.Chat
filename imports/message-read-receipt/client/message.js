import { Template } from 'meteor/templating';
import { settings } from '/app/settings';

Template.message.helpers({
	readReceipt() {
		if (!settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}

		return {
			readByEveryone: (!this.unread && 'read') || 'color-component-color',
		};
	},
});
