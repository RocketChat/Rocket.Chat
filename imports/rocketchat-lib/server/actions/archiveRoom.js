import { Meteor } from 'meteor/meteor';

export default {
	async archiveRoom(ctx) {
		const { uid, rid } = ctx.params;

		const room = RocketChat.models.Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'archiveRoom' });
		}

		if (!await RocketChat.Services.call('authorization.hasPermission', { uid, permission: 'archive-room', scope: room._id })) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'archiveRoom' });
		}

		if (room.t === 'd') {
			throw new Meteor.Error('error-direct-message-room', 'Direct Messages can not be archived', { method: 'archiveRoom' });
		}

		return RocketChat.archiveRoom(rid);
	},
};
