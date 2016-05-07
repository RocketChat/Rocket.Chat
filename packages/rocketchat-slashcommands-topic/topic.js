/*
* Join is a named function that will replace /topic commands
* @param {Object} message - The message object
*/

function Topic (command, params, item) {
	if (RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', item.rid)) {
		Meteor.call('saveRoomSettings', item.rid, 'roomTopic', params, (err, result) => {
			if (err) {
				return handleError(err)
			}
		})
	}
}

RocketChat.slashCommands.add('topic', Topic, {
	description: TAPi18n.__('Slash_Topic_Description'),
	params: TAPi18n.__('Slash_Topic_Params')
});
