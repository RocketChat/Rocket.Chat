import { Importers } from 'meteor/rocketchat:importer';
import { SlackImporterInfo } from '../info';

Importers.add(new SlackImporterInfo());
