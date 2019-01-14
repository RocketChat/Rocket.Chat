import { Importers } from 'meteor/rocketchat:importer';
import { SlackUsersImporterInfo } from '../lib/info';

Importers.add(new SlackUsersImporterInfo());
