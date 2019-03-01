import { slashCommands } from 'meteor/rocketchat:utils';

slashCommands.add('invite-all-to', undefined, {
	description: 'Invite_user_to_join_channel_all_to',
	params: '#room',
});
slashCommands.add('invite-all-from', undefined, {
	description: 'Invite_user_to_join_channel_all_from',
	params: '#room',
});
