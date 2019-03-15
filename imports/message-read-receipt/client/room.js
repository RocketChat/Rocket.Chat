import { t } from 'meteor/rocketchat:utils';
import { modal, MessageAction } from 'meteor/rocketchat:ui-utils';
import { settings } from 'meteor/rocketchat:settings';

MessageAction.addButton({
	id: 'receipt-detail',
	icon: 'info-circled',
	label: 'Message_info',
	context: ['starred', 'message', 'message-mobile'],
	action() {
		const message = this._arguments[1];
		modal.open({
			title: t('Message_info'),
			content: 'readReceipts',
			data: {
				messageId: message._id,
			},
			showConfirmButton: true,
			showCancelButton: false,
			confirmButtonText: t('Close'),
		});
	},
	condition() {
		return settings.get('Message_Read_Receipt_Store_Users');
	},
	order: 1,
	group: 'menu',
});
