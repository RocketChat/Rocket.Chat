RocketChat.saveStreamingOptions = function(rid, options) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveStreamingOptions',
		});
	}

	check(options, {
		type: Match.Optional(String),
		url: Match.Optional(String),
		thumbnail: Match.Optional(String),
		isAudioOnly: Match.Optional(String),
		message: Match.Optional(String),
	});

	RocketChat.models.Rooms.setStreamingOptionsById(rid, options);
};
