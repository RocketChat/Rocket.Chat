import { Meteor } from 'meteor/meteor';
Meteor.methods({
	'assistify:getParentChannelId'(channelName) {

		const options = {
			fields: {
				name: 1,
				t: 1,
			},
		};

		const cursorHandle = RocketChat.models.Rooms.findByNameAndTypesNotInIds(channelName, ['c', 'p'], '', options);
		const room = cursorHandle.fetch();
		if (!room.length) {
			throw new Meteor.Error('invalid-channel', 'Invalid channel', { method: 'assistify:getParentChannelId' });
		}
		return room[0]._id;
	},
});
