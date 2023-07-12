import { ui } from '../../lib/ui';

ui.addSlashCommand({
	command: 'federation',
	callback: undefined,
	options: {
		description: 'Federation_slash_commands',
		params: '#command (dm) #user',
	},
	result: undefined,
	providesPreview: false,
	previewer: undefined,
	previewCallback: undefined,
});
