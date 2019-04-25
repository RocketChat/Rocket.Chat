import { Importers } from '../../importer/server';
import { CsvImporterInfo } from '../lib/info';
import { CsvImporter } from './importer';

Importers.add(new CsvImporterInfo(), CsvImporter);
