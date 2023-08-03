import { Importers } from '../../importer/server';
import { CsvImporter } from './importer';

Importers.add({
	key: 'csv',
	name: 'CSV',
	importer: CsvImporter,
});
