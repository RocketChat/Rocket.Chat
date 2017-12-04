import s from 'underscore.string';

/*
 * Me is a named function that will replace /me commands
 * @param {Object} message - The message object
 */
RocketChat.slashCommands.add('me', function Me(command, params, item) {
	if (command !== 'me') {
		return;
	}
	if (s.trim(params)) {
		const msg = item;
		msg.msg = `_${ params }_`;
		Meteor.call('sendMessage', msg);
	}
}, {
	description: 'Displays_action_text',
	params: 'your_message'
});
