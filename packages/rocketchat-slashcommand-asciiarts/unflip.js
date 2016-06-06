/*
* Unflip is a named function that will replace /unflip commands
* @param {Object} message - The message object
*/


function Unflip(command, params, item) {
	if (command === 'unflip') {
		var msg;

		msg = item;
		msg.msg = params + ' ┬─┬﻿ ノ( ゜-゜ノ)';
		Meteor.call('sendMessage', msg);
	}
}

RocketChat.slashCommands.add('unflip', Unflip, {
	description: 'Slash_TableUnflip_Description',
	params: 'your message (optional)'
});
