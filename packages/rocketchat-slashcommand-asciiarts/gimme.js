/*
* Gimme is a named function that will replace /gimme commands
* @param {Object} message - The message object
*/


function Gimme(command, params, item) {
	if (command === 'gimme') {
		var msg;

		msg = item;
		msg.msg = params + ' ༼ つ ◕_◕ ༽つ';
		Meteor.call('sendMessage', msg);
	}
}

RocketChat.slashCommands.add('gimme', Gimme, {
	description: 'Slash_Gimme_Description',
	params: 'your message (optional)'
});
