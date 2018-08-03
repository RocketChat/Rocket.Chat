RocketChat.saveStreamingOptions = function(rid, { type, ...options }) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			'function': 'RocketChat.saveStreamingOptions'
		});
	}

	if (type === 'call') {
		return RocketChat.models.Rooms.setStreamingOptionsById(rid, { type });
	}

	if (!options.type) {
		options.type = 'livestream';
	}

	const { url, thumbnail, isAudioOnly, message } = options;

	RocketChat.models.Rooms.setStreamingOptionsById(rid, { url, thumbnail, isAudioOnly, message });
};
