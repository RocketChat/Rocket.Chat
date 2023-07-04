import { CsvImporter } from './importer';
import { Importers } from '../../importer/server';

Importers.add({
	key: 'csv',
	name: 'CSV',
	importer: CsvImporter,
});
