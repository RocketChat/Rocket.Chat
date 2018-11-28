import { Meteor } from 'meteor/meteor';

export default {
	async cleanRoomHistory(ctx) {
		const { rid, latest, oldest, inclusive, limit, excludePinned, filesOnly, fromUsers, uid } = ctx.params;
		if (uid && !await ctx.call('authorization.hasPermission', { uid, permission: 'clean-channel-history', scope: rid })) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'cleanRoomHistory' });
		}
		return RocketChat.cleanRoomHistory({ rid, latest, oldest, inclusive, limit, excludePinned, filesOnly, fromUsers });
	},
};
