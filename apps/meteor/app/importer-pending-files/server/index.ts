import { PendingFileImporter } from './PendingFileImporter';
import { Importers } from '../../importer/server';

Importers.add({
	key: 'pending-files',
	name: 'Pending Files',
	visible: false,
	importer: PendingFileImporter,
});
