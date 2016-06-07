/*
* Lenny is a named function that will replace /lenny commands
* @param {Object} message - The message object
*/


function LennyFace(command, params, item) {
	if (command === 'lennyface') {
		var msg;

		msg = item;
		msg.msg = params + ' ( ͡° ͜ʖ ͡°)';
		Meteor.call('sendMessage', msg);
	}
}

RocketChat.slashCommands.add('lennyface', LennyFace, {
	description: 'Slash_LennyFace_Description',
	params: 'your message (optional)'
});
