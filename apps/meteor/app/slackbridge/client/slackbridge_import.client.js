import { settings } from '../../settings/client';
import { slashCommands } from '../../utils/client/slashCommand';

settings.onload('SlackBridge_Enabled', (key, value) => {
	if (value) {
		slashCommands.add({
			command: 'slackbridge-import',
			options: {
				description: 'Import_old_messages_from_slackbridge',
			},
		});
	} else {
		delete slashCommands.commands['slackbridge-import'];
	}
});
