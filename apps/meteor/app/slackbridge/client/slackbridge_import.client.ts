import { settings } from '../../../client/lib/settings';
import { slashCommands } from '../../utils/client/slashCommand';

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
