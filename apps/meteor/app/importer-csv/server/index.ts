import { Importers } from '../../importer/server';
import { CsvImporter } from './CsvImporter';

Importers.add({
	key: 'csv',
	name: 'CSV',
	importer: CsvImporter,
});
