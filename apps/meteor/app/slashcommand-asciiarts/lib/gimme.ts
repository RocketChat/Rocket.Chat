import { Meteor } from 'meteor/meteor';
import type { IMessage } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
/*
 * Gimme is a named function that will replace /gimme commands
 * @param {Object} message - The message object
 */

function Gimme(_command: 'gimme', params: string, item: IMessage): void {
	const msg = item;
	msg.msg = `༼ つ ◕_◕ ༽つ ${params}`;
	Meteor.call('sendMessage', msg);
}

slashCommands.add('gimme', Gimme, {
	description: 'Slash_Gimme_Description',
	params: 'your_message_optional',
});
