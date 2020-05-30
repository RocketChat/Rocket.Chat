import { ImporterInfo } from '../../app/importer/lib/ImporterInfo';

export class PendingFileImporterInfo extends ImporterInfo {
	constructor() {
		super('pending-files', 'Pending Files', '');
	}
}
