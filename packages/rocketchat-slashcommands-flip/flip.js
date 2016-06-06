/*
* Flip is a named function that will replace /flip commands
* @param {Object} message - The message object
*/


function Flip(command, params, item) {
	if (command === 'flip') {
		var msg;

		msg = item;
		msg.msg = params + ' (╯°□°）╯︵ ┻━┻';
		Meteor.call('sendMessage', msg);
	}
}

RocketChat.slashCommands.add('flip', Flip, {
	description: 'Slash_Flip_Description',
	params: 'your message (optional)'
});
