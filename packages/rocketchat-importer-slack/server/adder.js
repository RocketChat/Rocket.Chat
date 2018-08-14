import { Importers } from 'meteor/rocketchat:importer';
import { SlackImporterInfo } from '../info';
import { SlackImporter } from './importer';

Importers.add(new SlackImporterInfo(), SlackImporter);
