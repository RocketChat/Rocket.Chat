Meteor.methods({
	'assistify:getParentChannelId'(channelName) {

		const options = {
			fields: {
				name: 1,
				t: 1
			}
		};

		const cursorHandle = RocketChat.models.Rooms.findByNameAndTypesNotInIds(channelName, ['c', 'p'], '', options);
		const rooms = cursorHandle.fetch();
		if (rooms.length) {
			return rooms[0];
		}
	}
});
