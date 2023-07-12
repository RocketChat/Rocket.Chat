import { ui } from '../../../client/lib/ui';

ui.addSlashCommand({
	command: 'create',
	options: {
		description: 'Create_A_New_Channel',
		params: '#channel',
		permission: ['create-c', 'create-p'],
	},
	providesPreview: false,
});
