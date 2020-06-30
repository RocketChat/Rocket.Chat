import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { t } from '../../../app/utils';
import { modal, MessageAction } from '../../../app/ui-utils';
import { messageArgs } from '../../../app/ui-utils/client/lib/messageArgs';
import { settings } from '../../../app/settings';


Meteor.startup(() => {
	Tracker.autorun(() => {
		const enabled = settings.get('Message_Read_Receipt_Store_Users');

		if (!enabled) {
			return MessageAction.removeButton('receipt-detail');
		}

		MessageAction.addButton({
			id: 'receipt-detail',
			icon: 'info-circled',
			label: 'Info',
			context: ['starred', 'message', 'message-mobile', 'threads'],
			action() {
				const { msg: message } = messageArgs(this);
				modal.open({
					title: t('Info'),
					content: 'readReceipts',
					data: {
						messageId: message._id,
					},
					showConfirmButton: true,
					showCancelButton: false,
					confirmButtonText: t('Close'),
				});
			},
			order: 10,
			group: 'menu',
		});
	});
});
