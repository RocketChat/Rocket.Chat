import { RocketChat } from 'meteor/rocketchat:lib';

/**
 * Copy metadata from the thread to the system message in the parent channel
 * which links to the thread.
 * Since we don't pass this metadata into the model's function, it is not a subject
 * to race conditions: If multiple updates occur, the current state will be updated
 * only if the new state of the thread room is really newer.
 */
Object.assign(RocketChat.models.Messages, {
	refreshThreadMetadata({ rid, pmid }) {
		if (!rid || !pmid) {
			return false;
		}
		const { lm, msgs: count } = RocketChat.models.Rooms.findOneById(rid, {
			fields: {
				msgs: 1,
				lm: 1,
			},
		});

		const query = {
			_id: pmid,
		};

		return this.update(query, {
			$set: {
				t_rid: rid,
				'attachments.0.fields': [
					{
						type: 'messageCounter',
						count,
					},
					{
						type: 'lastMessageAge',
						lm,
					}],
			},
		});
	},
});
