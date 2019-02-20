import { slashCommands } from 'meteor/rocketchat:utils';

slashCommands.add('thread', null, {
	description: 'Thread_slash_command_description',
	params: 'Thread_slash_command_params',
});
