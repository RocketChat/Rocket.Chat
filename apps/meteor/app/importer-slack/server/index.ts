import { SlackImporter } from './SlackImporter';
import { Importers } from '../../importer/server';

Importers.add({
	key: 'slack',
	name: 'Slack',
	importer: SlackImporter,
	acceptedFileTypes: '.zip,application/zip,application/x-zip,application/x-zip-compressed',
});
