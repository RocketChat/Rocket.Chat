/*
* Shrug is a named function that will replace /shrug commands
* @param {Object} message - The message object
*/


function Shrug(command, params, item) {
	if (command === 'shrug') {
		const msg = item;
		msg.msg = `${ params } ¯\\_(ツ)_/¯`;
		Meteor.call('sendMessage', msg);
	}
}

RocketChat.slashCommands.add('shrug', Shrug, {
	description: 'Slash_Shrug_Description',
	params: 'your_message_optional'
});
