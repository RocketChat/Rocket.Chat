import { Importers } from '../../importer/server';
import { SlackUsersImporter } from './SlackUsersImporter';

Importers.add({
	key: 'slack-users',
	name: 'Slack_Users',
	importer: SlackUsersImporter,
});
