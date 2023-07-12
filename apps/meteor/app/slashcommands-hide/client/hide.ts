import { ui } from '../../../client/lib/ui';

ui.addSlashCommand({
	command: 'hide',
	options: {
		description: 'Hide_room',
		params: '#room',
	},
});
