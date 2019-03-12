import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { RoomManager, MessageAction } from '/app/ui-utils';
import { handleError } from '/app/utils';
import { ChatSubscription } from '/app/models';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'mark-message-as-unread',
		icon: 'flag',
		label: 'Mark_as_unread',
		context: ['message', 'message-mobile'],
		action() {
			const message = this._arguments[1];
			return Meteor.call('unreadMessages', message, function(error) {
				if (error) {
					return handleError(error);
				}
				const subscription = ChatSubscription.findOne({
					rid: message.rid,
				});
				if (subscription == null) {
					return;
				}
				RoomManager.close(subscription.t + subscription.name);
				return FlowRouter.go('home');
			});
		},
		condition(message) {
			return message.u._id !== Meteor.user()._id;
		},
		order: 22,
		group: 'menu',
	});
});
