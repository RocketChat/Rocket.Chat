import { Importers } from 'meteor/rocketchat:importer';
import { SlackImporterInfo } from '../lib/info';

Importers.add(new SlackImporterInfo());
