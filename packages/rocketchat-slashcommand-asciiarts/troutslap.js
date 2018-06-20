/*
* Slap is a named function that will replace /slap commands
* @param {Object} message - The message object
*/


function Slap(command, params, item) {
	if (command === 'slap') {
		const msg = item;
		msg.msg = `slaps ${ params } with a large trout ><(((°>`;
		Meteor.call('sendMessage', msg);
	}
}

RocketChat.slashCommands.add('slap', Slap, {
	description: 'Slash_slap_Description',
	params: 'your_message_optional'
});
