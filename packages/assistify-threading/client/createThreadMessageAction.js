import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { call } from 'meteor/rocketchat:lib';

const condition = (rid, uid) => {
	if (!RocketChat.models.Subscriptions.findOne({ rid })) {
		return false;
	}
	return uid !== Meteor.userId() ? RocketChat.authz.hasPermission('start-thread-other-user') : RocketChat.authz.hasPermission('start-thread');
};

Meteor.startup(function() {
	RocketChat.settings.get('Thread_from_context_menu', (key, value) => {

		if (value !== 'button') {
			return RocketChat.MessageAction.removeButton('start-thread');
		}

		RocketChat.MessageAction.addButton({
			id: 'start-thread',
			icon: 'thread',
			label: 'Thread_start',
			context: ['message', 'message-mobile'],
			async action() {
				const [, message] = this._arguments;
				const { _id } = await call('createThreadFromMessage', message);
				FlowRouter.goToRoomById(_id);
			},
			condition({ rid, u: { _id: uid } }) {
				return condition(rid, uid);
			},
			order: 0,
			group: 'menu',
		});
	});
});
