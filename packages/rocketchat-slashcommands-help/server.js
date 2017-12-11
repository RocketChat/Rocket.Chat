
/*
* Help is a named function that will replace /join commands
* @param {Object} message - The message object
*/


RocketChat.slashCommands.add('help', function Help(command, params, item) {

	if (command !== 'help') {
		return;
	}
	const user = Meteor.users.findOne(Meteor.userId());
	const keys = [{
		'Open_channel_user_search': 'Command (or Ctrl) + p OR Command (or Ctrl) + k'
	},
	{
		'Edit_previous_message': 'Up Arrow'
	},
	{
		'Move_beginning_message': 'Command (or Alt) + Left Arrow'
	},
	{
		'Move_beginning_message': 'Command (or Alt) + Up Arrow'
	},
	{
		'Move_end_message': 'Command (or Alt) + Right Arrow'
	},
	{
		'Move_end_message': 'Command (or Alt) + Down Arrow'
	},
	{
		'New_line_message_compose_input': 'Shift + Enter'
	}
	];
	keys.map((key) => {
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date,
			msg: TAPi18n.__(Object.keys(key)[0], {
				postProcess: 'sprintf',
				sprintf: [key[Object.keys(key)[0]]]
			}, user.language)
		});
	});

});
