import { CsvImporter } from './importer';
import { Importers } from '../..';
import { CsvImporterInfo } from './info';

Importers.add(new CsvImporterInfo(), CsvImporter);
