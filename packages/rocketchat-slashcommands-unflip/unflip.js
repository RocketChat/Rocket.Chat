/*
* Unflip is a named function that will replace /unflip commands
* @param {Object} message - The message object
*/


function Unflip(command, params, item) {
	if (command === 'Unflip') {
		var msg;

		msg = item;
		msg.msg = params + ' ¯(╯°□°）╯︵ ┻━┻';
		Meteor.call('sendMessage', msg);
	}
}

RocketChat.slashCommands.add('Unflip', Shrug, {
	description: 'Slash_Tableflip_Description',
	params: 'your message (optional)'
});
