import { ui } from '../../../client/lib/ui';

ui.addSlashCommand({
	command: 'invite',
	options: {
		description: 'Invite_user_to_join_channel',
		params: '@username',
		permission: 'add-user-to-joined-room',
	},
	providesPreview: false,
});
