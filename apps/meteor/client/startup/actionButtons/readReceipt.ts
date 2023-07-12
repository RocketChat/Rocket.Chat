import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../app/settings/client';
import { imperativeModal } from '../../lib/imperativeModal';
import { ui } from '../../lib/ui';
import { messageArgs } from '../../lib/utils/messageArgs';
import ReadReceiptsModal from '../../views/room/modals/ReadReceiptsModal';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const enabled = settings.get('Message_Read_Receipt_Store_Users');

		if (!enabled) {
			ui.removeMessageAction('receipt-detail');
			return;
		}

		ui.addMessageAction({
			id: 'receipt-detail',
			icon: 'info-circled',
			label: 'Info',
			context: ['starred', 'message', 'message-mobile', 'threads'],
			action(_, props) {
				const { message = messageArgs(this).msg } = props;
				imperativeModal.open({
					component: ReadReceiptsModal,
					props: { messageId: message._id, onClose: imperativeModal.close },
				});
			},
			order: 10,
			group: 'menu',
		});
	});
});
