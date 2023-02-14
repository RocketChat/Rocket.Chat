import { settings } from '../../settings';
import { slashCommands } from '../../utils';

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
