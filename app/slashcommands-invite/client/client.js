import { slashCommands } from '../../utils';

slashCommands.add('invite', undefined, {
	description: 'Invite_user_to_join_channel',
	params: '@username',
});
