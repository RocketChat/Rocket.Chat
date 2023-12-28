import { Importers } from '../../importer/server';
import { SlackImporter } from './SlackImporter';

Importers.add({
	key: 'slack',
	name: 'Slack',
	importer: SlackImporter,
});
