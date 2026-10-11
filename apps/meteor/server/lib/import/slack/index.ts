import { Importers } from '..';
import { SlackImporter } from './SlackImporter';

Importers.add({
	key: 'slack',
	name: 'Slack',
	importer: SlackImporter,
});
