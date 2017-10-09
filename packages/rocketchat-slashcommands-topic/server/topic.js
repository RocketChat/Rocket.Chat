/*
 * Join is a named function that will replace /topic commands
 * @param {Object} message - The message object
 */

function Topic(command, params, item) {
	if (command === 'topic') {
		if (RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', item.rid)) {
			Meteor.call('saveRoomSettings', item.rid, 'roomTopic', params, (err) => {
				if (err) {
					throw err;
				}
			});
		}
	}
}

RocketChat.slashCommands.add('topic', Topic, {
	description: 'Slash_Topic_Description',
	params: 'Slash_Topic_Params'
});
