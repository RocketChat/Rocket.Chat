import { slashCommands } from '../../../app/utils/client/slashCommand';
import { settings } from '../../lib/settings';

settings.observe('SlackBridge_Enabled', (_key, value) => {
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
