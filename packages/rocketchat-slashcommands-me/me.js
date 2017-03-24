
/*
 * Me is a named function that will replace /me commands
 * @param {Object} message - The message object
 */
const Me = function(command, params, item) {
	if (command !== 'me') {
		return;
	}
	if (_.trim(params)) {
		const msg = item;
		msg.msg = `_${ params }_`;
		Meteor.call('sendMessage', msg);
	}
};

RocketChat.slashCommands.add('me', Me, {
	description: 'Displays_action_text',
	params: 'your_message'
});
