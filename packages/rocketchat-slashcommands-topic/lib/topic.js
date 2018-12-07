import { Meteor } from 'meteor/meteor';
import { RocketChat, handleError } from 'meteor/rocketchat:lib';
import { ChatRoom } from 'meteor/rocketchat:ui';
/*
 * Join is a named function that will replace /topic commands
 * @param {Object} message - The message object
 */

function Topic(command, params, item) {
	if (command === 'topic') {
		if ((Meteor.isClient && RocketChat.authz.hasPermission('edit-room', item.rid)) || (Meteor.isServer && RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', item.rid))) {
			Meteor.call('saveRoomSettings', item.rid, 'roomTopic', params, (err) => {
				if (err) {
					if (Meteor.isClient) {
						return handleError(err);
					} else {
						throw err;
					}
				}

				if (Meteor.isClient) {
					RocketChat.callbacks.run('roomTopicChanged', ChatRoom.findOne(item.rid));
				}
			});
		}
	}
}

RocketChat.slashCommands.add('topic', Topic, {
	description: 'Slash_Topic_Description',
	params: 'Slash_Topic_Params',
});
