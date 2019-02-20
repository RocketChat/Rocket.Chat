import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Rooms } from 'meteor/rocketchat:models';
Meteor.methods({
	'assistify:getParentChannelId'(channelName) {
		check(channelName, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
		}

		const options = {
			fields: {
				name: 1,
				t: 1,
			},
		};

		const cursorHandle = Rooms.findByNameAndTypesNotInIds(channelName, ['c', 'p'], '', options);
		const room = cursorHandle.fetch();
		if (!room.length) {
			throw new Meteor.Error('invalid-channel', 'Invalid channel', { method: 'assistify:getParentChannelId' });
		}
		return room[0]._id;
	},
});
