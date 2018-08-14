import { Importers } from 'meteor/rocketchat:importer';
import { CsvImporterInfo } from '../info';
import { CsvImporter } from './importer';

Importers.add(new CsvImporterInfo(), CsvImporter);
