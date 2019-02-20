import { Messages, Rooms } from 'meteor/rocketchat:models';

/**
 * Copy metadata from the thread to the system message in the parent channel
 * which links to the thread.
 * Since we don't pass this metadata into the model's function, it is not a subject
 * to race conditions: If multiple updates occur, the current state will be updated
 * only if the new state of the thread room is really newer.
 */
Object.assign(Messages, {
	refreshThreadMetadata(linkMessageId) {
		const linkMessage = this.findOneById(linkMessageId);

		if (linkMessage && linkMessage.channels[0] && linkMessage.channels[0]._id) {
			const threadRoom = Rooms.findOneById(linkMessage.channels[0]._id);
			const query = {
				_id: linkMessageId,
				_updatedAt: {
					$lt: threadRoom._updatedAt,
				},
			};

			return this.update(query, {
				$set: {
					'attachments.0.fields': [
						{
							type: 'messageCounter',
							count: threadRoom.msgs,
						},
						{
							type: 'lastMessageAge',
							lm: threadRoom.lm,
						}],
				},
			});
		} else { return null; }
	},
});
