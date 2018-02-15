import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';

Template.room.events({
	'click .read-receipt'(event) {
		if (!RocketChat.settings.get('Message_Read_Receipt_Store_Users')) {
			return;
		}
		const data = Blaze.getData(event.currentTarget);
		const messageId = data && data._arguments && data._arguments[1] && data._arguments[1]._id;
		modal.open({
			title: t('Read_receipts'),
			content: 'readReceipts',
			data: {
				messageId
			},
			showConfirmButton: true,
			showCancelButton: false,
			confirmButtonText: t('Close')
		});
	}
});
