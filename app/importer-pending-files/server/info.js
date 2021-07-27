import { ImporterInfo } from '../../importer/lib/ImporterInfo';

export class PendingFileImporterInfo extends ImporterInfo {
	constructor() {
		super('pending-files', 'Pending Files', '');
	}
}
