import { Importers } from '../../importer/server';
import { SlackUsersImporter } from './importer';

Importers.add({
	key: 'slack-users',
	name: 'Slack_Users',
	importer: SlackUsersImporter,
});
