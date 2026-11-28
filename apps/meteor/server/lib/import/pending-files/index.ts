import { Importers } from '..';
import { PendingFileImporter } from './PendingFileImporter';

Importers.add({
	key: 'pending-files',
	name: 'Pending Files',
	visible: false,
	importer: PendingFileImporter,
});
