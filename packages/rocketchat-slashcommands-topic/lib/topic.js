import { Meteor } from 'meteor/meteor';
import { handleError, slashCommands } from 'meteor/rocketchat:utils';
import { ChatRoom } from 'meteor/rocketchat:models';
import { callbacks } from 'meteor/rocketchat:callbacks';
import { hasPermission } from 'meteor/rocketchat:authorization';
/*
 * Join is a named function that will replace /topic commands
 * @param {Object} message - The message object
 */

function Topic(command, params, item) {
	if (command === 'topic') {
		if ((Meteor.isClient && hasPermission('edit-room', item.rid)) || (Meteor.isServer && hasPermission(Meteor.userId(), 'edit-room', item.rid))) {
			Meteor.call('saveRoomSettings', item.rid, 'roomTopic', params, (err) => {
				if (err) {
					if (Meteor.isClient) {
						return handleError(err);
					} else {
						throw err;
					}
				}

				if (Meteor.isClient) {
					callbacks.run('roomTopicChanged', ChatRoom.findOne(item.rid));
				}
			});
		}
	}
}

slashCommands.add('topic', Topic, {
	description: 'Slash_Topic_Description',
	params: 'Slash_Topic_Params',
});
