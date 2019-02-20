import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { slashCommands } from 'meteor/rocketchat:utils';
function CreateThread(command, params, item) {
	if (command !== 'thread' || !Match.test(params, String)) {
		return;
	}

	const openingMessage = params.trim();

	Meteor.call('createThread', item.rid, { msg: openingMessage });
}

slashCommands.add('thread', CreateThread, {
	description: 'Thread_slash_command_description',
	params: 'Thread_slash_command_params',
});
