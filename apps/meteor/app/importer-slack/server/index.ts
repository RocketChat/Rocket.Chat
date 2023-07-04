import { SlackImporter } from './importer';
import { Importers } from '../../importer/server';

Importers.add({
	key: 'slack',
	name: 'Slack',
	importer: SlackImporter,
});
