import { PendingFileImporter } from './importer';
import { Importers } from '../../importer/server';

Importers.add({
	key: 'pending-files',
	name: 'Pending Files',
	visible: false,
	importer: PendingFileImporter,
});
