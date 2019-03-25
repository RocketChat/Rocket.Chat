import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Subscriptions } from '../../models/client';
import { settings } from '../../settings/client';
import { hasPermission } from '../../authorization/client';
import { MessageAction, modal } from '../../ui-utils/client';
import { t } from '../../utils/client';

const condition = (rid, uid) => {
	if (!Subscriptions.findOne({ rid })) {
		return false;
	}
	return uid !== Meteor.userId() ? hasPermission('start-discussion-other-user') : hasPermission('start-discussion');
};

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
				const [, message] = this._arguments;

				modal.open({
					title: t('Discussion_title'),
					modifier: 'modal',
					content: 'CreateDiscussion',
					data: { rid: message.rid, message, onCreate() {
						modal.close();
					} },
					confirmOnEnter: false,
					showConfirmButton: false,
					showCancelButton: false,
				});
			},
			condition({ rid, u: { _id: uid }, drid, dcount }) {
				if (drid || !isNaN(dcount)) {
					return false;
				}
				return condition(rid, uid);
			},
			order: 0,
			group: 'menu',
		});
	});
});
