/**
 * Enhance the Messages model to capture metadata containing information about how the message
 * was created and is to be handled
 */
// import {_} from 'underscore';

_.extend(RocketChat.models.Messages, {
	addMetadata(message, metadata) {
		const query = { _id: message._id };

		const update = {
			$set: {
				meta: metadata
			}
		};

		return this.update(query, update);
	}
});
