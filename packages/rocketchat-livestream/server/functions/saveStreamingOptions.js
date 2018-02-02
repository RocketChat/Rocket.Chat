RocketChat.saveStreamingOptions = function(rid, streamingOptions) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			'function': 'RocketChat.saveStreamingOptions'
		});
	}

	return RocketChat.models.Rooms.setStreamingOptionsById(rid, streamingOptions);
};
