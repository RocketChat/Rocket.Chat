import { Importers } from 'meteor/rocketchat:importer';
import { HipChatImporterInfo } from '../info';

Importers.add(new HipChatImporterInfo());
