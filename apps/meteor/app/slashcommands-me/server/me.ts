import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { IMessage } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';

/*
 * Me is a named function that will replace /me commands
 * @param {Object} message - The message object
 */
slashCommands.add(
	'me',
	function Me(_command: 'me', params: string, item: IMessage): void {
		if (s.trim(params)) {
			const msg = item;
			msg.msg = `_${params}_`;
			Meteor.call('sendMessage', msg);
		}
	},
	{
		description: 'Displays_action_text',
		params: 'your_message',
	},
);
