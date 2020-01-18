import { CsvImporter } from './importer';
import { Importers } from '../../importer/server';
import { CsvImporterInfo } from '../lib/info';

Importers.add(new CsvImporterInfo(), CsvImporter);
