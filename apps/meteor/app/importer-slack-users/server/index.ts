import { SlackUsersImporter } from './importer';
import { Importers } from '../../importer/server';

Importers.add({
	key: 'slack-users',
	name: 'Slack_Users',
	importer: SlackUsersImporter,
});
