import { ui } from '../../../client/lib/ui';

ui.addSlashCommand({
	command: 'archive',
	options: {
		description: 'Archive',
		params: '#channel',
		permission: 'archive-room',
	},
	providesPreview: false,
});
