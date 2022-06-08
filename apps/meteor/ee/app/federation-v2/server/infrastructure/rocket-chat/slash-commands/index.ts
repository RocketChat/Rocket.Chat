import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { federationRoomServiceSender } from '../../../../../../../app/federation-v2/server';
import { FederationRoomSenderConverter } from '../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/converters/RoomSender';
import { slashCommands } from '../../../../../../../app/utils/lib/slashCommand';
import {
	executeSlashCommand,
	FEDERATION_COMMANDS,
} from '../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/slash-commands';

const EE_FEDERATION_COMMANDS = {
	...FEDERATION_COMMANDS,
	'setup-room': async () => {},
	'invite': async () => {},
};

function federation(providedCommand: string, stringParams: string | undefined, item: Record<string, any>): void {
	Promise.await(executeSlashCommand(providedCommand, stringParams, item, EE_FEDERATION_COMMANDS));
}

slashCommands.add('federation', federation, {
	description: 'Federation_slash_commands',
	params: '#command (dm, setup-room, invite) #user',
});
