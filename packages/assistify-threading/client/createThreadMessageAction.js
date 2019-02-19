import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { RocketChat } from 'meteor/rocketchat:lib';
import { modal } from 'meteor/rocketchat:ui';

const condition = (rid, uid) => {
	if (!RocketChat.models.Subscriptions.findOne({ rid })) {
		return false;
	}
	return uid !== Meteor.userId() ? RocketChat.authz.hasPermission('start-thread-other-user') : RocketChat.authz.hasPermission('start-thread');
};

Meteor.startup(function() {
	Tracker.autorun(() => {
		if (RocketChat.settings.get('Thread_from_context_menu') !== 'button') {
			return RocketChat.MessageAction.removeButton('start-thread');
		}

		RocketChat.MessageAction.addButton({
			id: 'start-thread',
			icon: 'thread',
			label: 'Thread_start',
			context: ['message', 'message-mobile'],
			async action() {
				const [, message] = this._arguments;

				modal.open({
					content: 'CreateThread',
					data : { rid: message.rid, message },
					showConfirmButton: false,
					showCancelButton: false,
				});
			},
			condition({ rid, u: { _id: uid }, attachments }) {
				if (attachments && attachments[0].fields && attachments[0].fields[0].type === 'messageCounter') {
					return false;
				}
				return condition(rid, uid);
			},
			order: 0,
			group: 'menu',
		});
	});
});
