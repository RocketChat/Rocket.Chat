
/*
* Leave is a named function that will replace /leave commands
* @param {Object} message - The message object
*/
function Leave(command, params, item) {
	if (command !== 'leave' && command !== 'part') {
		return;
	}

	try {
		Meteor.call('leaveRoom', item.rid);
	} catch ({error}) {
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date,
			msg: TAPi18n.__(error, null, Meteor.user().language)
		});
	}
}

RocketChat.slashCommands.add('leave', Leave, { description: 'Leave_the_current_channel' });
RocketChat.slashCommands.add('part', Leave, { description: 'Leave_the_current_channel' });
