import { Template } from 'meteor/templating';

import { settings } from '../../../app/settings';

Template.main.helpers({
	readReceiptsEnabled() {
		if (settings.get('Message_Read_Receipt_Store_Users')) {
			return 'read-receipts-enabled';
		}
	},
});
