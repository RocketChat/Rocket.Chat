import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings/client';
import { hasPermission } from '../../authorization/client';
import { MessageAction, modal } from '../../ui-utils/client';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';
import { t } from '../../utils/client';

Meteor.startup(function() {
	Tracker.autorun(() => {
		if (!settings.get('Discussion_enabled')) {
			return MessageAction.removeButton('start-discussion');
		}

		MessageAction.addButton({
			id: 'start-discussion',
			icon: 'discussion',
			label: 'Discussion_start',
			context: ['message', 'message-mobile'],
			async action() {
				const { msg: message } = messageArgs(this);

				modal.open({
					title: t('Discussion_title'),
					modifier: 'modal',
					content: 'CreateDiscussion',
					data: { rid: message.rid,
						message,
						onCreate() {
							modal.close();
						} },
					confirmOnEnter: false,
					showConfirmButton: false,
					showCancelButton: false,
				});
			},
			condition({ msg: { u: { _id: uid }, drid, dcount }, subscription, u }) {
				if (drid || !isNaN(dcount)) {
					return false;
				}
				if (!subscription) {
					return false;
				}

				return uid !== u._id ? hasPermission('start-discussion-other-user') : hasPermission('start-discussion');

			},
			order: 0,
			group: 'menu',
		});
	});
});
