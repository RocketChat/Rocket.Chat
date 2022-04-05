import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';

/*
 * Disapprove is a named function that will replace /disapprove commands
 * @param {Object} message - The message object
 */
slashCommands.add(
	'disapprove',
	function Disapprove(_command: 'disapprove', params: string, item: Record<string, string>): void {
		const msg = item;
		msg.msg = `${params} ಠ_ಠ`;
		Meteor.call('sendMessage', msg);
	},
	{
		description: 'Slash_Disapprove_Description',
		params: 'your_message_optional',
	},
	undefined,
	false,
	undefined,
	undefined,
);
