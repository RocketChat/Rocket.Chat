import { settings } from '../../settings';
import { slashCommands } from '../../utils';

settings.onload('SlackBridge_Enabled', (key, value) => {
	if (value) {
		slashCommands.add('slackbridge-import', null, {
			description: 'Import_old_messages_from_slackbridge',
		});
	} else {
		delete slashCommands.commands['slackbridge-import'];
	}
});
