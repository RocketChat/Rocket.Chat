RocketChat.models.Rooms.setStreamingOptionsById = function(_id, streamingOptions) {
	const update = {
		$set: {
			streamingOptions
		}
	};
	return this.update({ _id }, update);
};
