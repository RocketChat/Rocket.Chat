import { Meteor } from 'meteor/meteor';
import { FederationEE } from '@rocket.chat/core-services';

import { executeSlashCommand } from './action';
import { slashCommands } from '../../../../../../../app/utils/server';

const EE_FEDERATION_COMMANDS = {
	dm: async (currentUserId: string, _: string, invitees: string[]): Promise<void> =>
		FederationEE.createDirectMessageRoom(currentUserId, invitees),
};

function federation(providedCommand: string, stringParams: string | undefined, item: Record<string, any>): Promise<void> {
	return executeSlashCommand(providedCommand, stringParams, item, EE_FEDERATION_COMMANDS, Meteor.userId());
}

slashCommands.add({
	command: 'federation',
	callback: federation,
	options: {
		description: 'Federation_slash_commands',
		params: '#command (dm) #users',
	},
});
