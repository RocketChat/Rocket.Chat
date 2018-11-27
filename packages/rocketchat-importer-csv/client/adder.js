import { Importers } from 'meteor/rocketchat:importer';
import { CsvImporterInfo } from '../lib/info';

Importers.add(new CsvImporterInfo());
