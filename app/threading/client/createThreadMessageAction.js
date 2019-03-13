import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Subscriptions } from '/app/models';
import { settings } from '/app/settings';
import { hasPermission } from '/app/authorization';
import { MessageAction, modal } from '/app/ui-utils';


const condition = (rid, uid) => {
	if (!Subscriptions.findOne({ rid })) {
		return false;
	}
	return uid !== Meteor.userId() ? hasPermission('start-thread-other-user') : hasPermission('start-thread');
};

Meteor.startup(function() {
	Tracker.autorun(() => {
		if (settings.get('Thread_from_context_menu') !== 'button') {
			return MessageAction.removeButton('start-thread');
		}

		MessageAction.addButton({
			id: 'start-thread',
			icon: 'thread',
			label: 'Thread_start',
			context: ['message', 'message-mobile'],
			async action() {
				const [, message] = this._arguments;

				modal.open({
					content: 'CreateThread',
					data: { rid: message.rid, message, onCreate() {
						modal.close();
					} },
					showConfirmButton: false,
					showCancelButton: false,
				});
			},
			condition({ rid, u: { _id: uid }, attachments }) {
				if (attachments && attachments[0] && attachments[0].fields && attachments[0].fields[0].type === 'messageCounter') {
					return false;
				}
				return condition(rid, uid);
			},
			order: 0,
			group: 'menu',
		});
	});
});
