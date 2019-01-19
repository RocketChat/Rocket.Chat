import { Importers } from 'meteor/rocketchat:importer';
import { HipChatImporterInfo } from '../lib/info';

Importers.add(new HipChatImporterInfo());
