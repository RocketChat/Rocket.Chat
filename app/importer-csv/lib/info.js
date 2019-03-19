import { ImporterInfo } from '../../importer';

export class CsvImporterInfo extends ImporterInfo {
	constructor() {
		super('csv', 'CSV', 'application/zip', [{
			text: 'Importer_CSV_Information',
			href: 'https://rocket.chat/docs/administrator-guides/import/csv/',
		}]);
	}
}
