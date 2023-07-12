import { ui } from '../../../client/lib/ui';
import { settings } from '../../settings/client';

settings.onload('SlackBridge_Enabled', (key, value) => {
	if (!value) {
		ui.removeSlashCommand('slackbridge-import');
		return;
	}

	ui.addSlashCommand({
		command: 'slackbridge-import',
		options: {
			description: 'Import_old_messages_from_slackbridge',
		},
	});
});
