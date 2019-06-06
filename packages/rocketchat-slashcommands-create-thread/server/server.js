import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { slashCommands } from '../../../app/utils/client';

function createDiscussion(command, params, item) {
	if (command !== 'discussion' || !Match.test(params, String)) {
		return;
	}

	const openingMessage = params.trim();
	Meteor.call('createDiscussion', { prid: item.rid, pmid: item._id, t_name: null, reply: openingMessage });
}

slashCommands.add('discussion', createDiscussion, {
	description: 'Discussion_slash_command_description',
	params: 'Discussion_slash_command_params',
});
