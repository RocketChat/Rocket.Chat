import { Importers } from '..';
import { SlackUsersImporter } from './SlackUsersImporter';

Importers.add({
	key: 'slack-users',
	name: 'Slack_Users',
	importer: SlackUsersImporter,
});
