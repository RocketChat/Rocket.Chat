import { Importers } from 'meteor/rocketchat:importer';
import { SlackUsersImporterInfo } from '../info';

Importers.add(new SlackUsersImporterInfo());
