import { CsvImporter } from './importer';
import { Importers } from '../../old-importer/server';
import { CsvImporterInfo } from '../lib/info';

Importers.add(new CsvImporterInfo(), CsvImporter);
