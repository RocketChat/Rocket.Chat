import { ui } from '../../../client/lib/ui';

ui.addSlashCommand({
	command: 'unarchive',
	options: {
		description: 'Unarchive',
		params: '#channel',
		permission: 'unarchive-room',
	},
	providesPreview: false,
});
