import { Importers } from '../../importer/client';
import { ImporterInfo } from '../../../common/importer/ImporterInfo';

class CsvImporterInfo extends ImporterInfo {
	constructor() {
		super('csv', 'CSV', 'application/zip', [{
			text: 'Importer_CSV_Information',
			href: 'https://rocket.chat/docs/administrator-guides/import/csv/',
		}]);
	}
}

Importers.add(new CsvImporterInfo());
