import { CsvImporter } from './CsvImporter';
import { Importers } from '../../importer/server';

Importers.add({
	key: 'csv',
	name: 'CSV',
	importer: CsvImporter,
	acceptedFileTypes: '.csv,.zip,text/csv,application/zip,application/x-zip,application/x-zip-compressed',
});
