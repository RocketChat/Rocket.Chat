import { ui } from '../../../client/lib/ui';

ui.addSlashCommand({
	command: 'invite-all-to',
	options: {
		description: 'Invite_user_to_join_channel_all_to',
		params: '#room',
		permission: ['add-user-to-joined-room', 'add-user-to-any-c-room', 'add-user-to-any-p-room'],
	},
});

ui.addSlashCommand({
	command: 'invite-all-from',
	options: {
		description: 'Invite_user_to_join_channel_all_from',
		params: '#room',
		permission: 'add-user-to-joined-room',
	},
});
