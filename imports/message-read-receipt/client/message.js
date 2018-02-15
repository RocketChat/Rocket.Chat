import { Template } from 'meteor/templating';
import moment from 'moment';

Template.message.helpers({
	readReceipt() {
		if (!RocketChat.settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}

		return {
			readByEveryone: !this.unread && 'rc-tooltip read'
		};
	},
	readTime() {
		return moment(this.readAt).format('LLL');
	}
});
