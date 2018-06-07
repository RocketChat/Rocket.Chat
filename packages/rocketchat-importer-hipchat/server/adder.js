import { Importers } from 'meteor/rocketchat:importer';
import { HipChatImporterInfo } from '../info';
import { HipChatImporter } from './importer';

Importers.add(new HipChatImporterInfo(), HipChatImporter);
