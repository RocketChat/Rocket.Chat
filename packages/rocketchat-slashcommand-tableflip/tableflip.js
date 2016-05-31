/*
* Tableflip is a named function that will replace /Tableflip commands
* @param {Object} message - The message object
*/


function Tableflip(command, params, item) {
	if (command === 'Tableflip') {
		var msg;

		msg = item;
		msg.msg = params + ' ¯(╯°□°）╯︵ ┻━┻';
		Meteor.call('sendMessage', msg);
	}
}

RocketChat.slashCommands.add('Tableflip', Shrug, {
	description: 'Slash_Tableflip_Description',
	params: 'your message (optional)'
});
