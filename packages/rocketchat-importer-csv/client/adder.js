import { Importers } from 'meteor/rocketchat:importer';
import { CsvImporterInfo } from '../info';

Importers.add(new CsvImporterInfo());
