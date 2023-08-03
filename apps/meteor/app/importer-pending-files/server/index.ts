import { Importers } from '../../importer/server';
import { PendingFileImporter } from './importer';

Importers.add({
	key: 'pending-files',
	name: 'Pending Files',
	visible: false,
	importer: PendingFileImporter,
});
