import { Importers } from '../../importer/server';
import { SlackImporter } from './importer';

Importers.add({
	key: 'slack',
	name: 'Slack',
	importer: SlackImporter,
});
