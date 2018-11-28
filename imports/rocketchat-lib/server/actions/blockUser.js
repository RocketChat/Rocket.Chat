import { Meteor } from 'meteor/meteor';

export default {
	async blockUser(ctx) {
		const { uid, rid, blocked } = ctx.params;


		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, uid);
		const subscription2 = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, blocked);

		if (!subscription || !subscription2) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'blockUser' });
		}

		RocketChat.models.Subscriptions.setBlockedByRoomId(rid, blocked, uid);

		return true;
	},
};
