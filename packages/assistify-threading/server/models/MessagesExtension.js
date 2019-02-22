import { Messages, Rooms } from 'meteor/rocketchat:models';

/**
 * Copy metadata from the thread to the system message in the parent channel
 * which links to the thread.
 * Since we don't pass this metadata into the model's function, it is not a subject
 * to race conditions: If multiple updates occur, the current state will be updated
 * only if the new state of the thread room is really newer.
 */

//  TODO creaate sparse index for t_rid
Object.assign(Messages, {
	refreshThreadMetadata({ rid }) {
		if (!rid) {
			return false;
		}
		const { lm, msgs: count } = Rooms.findOneById(rid, {
			fields: {
				msgs: 1,
				lm: 1,
			},
		});

		const query = {
			t_rid: rid,
		};

		return this.update(query, {
			$set: {
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
		}, { multi: 1 });
	},
});
