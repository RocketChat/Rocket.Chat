/*
* Join is a named function that will replace /topic commands
* @param {Object} message - The message object
*/

function Topic(command, params, item) {
	if (command === 'topic') {
		if (Meteor.isClient && RocketChat.authz.hasAtLeastOnePermission('edit-room', item.rid) || (Meteor.isServer && RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', item.rid))) {
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
	description: TAPi18n.__('Slash_Topic_Description'),
	params: TAPi18n.__('Slash_Topic_Params')
});
