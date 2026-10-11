import { Importers } from '..';
import { CsvImporter } from './CsvImporter';

Importers.add({
	key: 'csv',
	name: 'CSV',
	importer: CsvImporter,
});
