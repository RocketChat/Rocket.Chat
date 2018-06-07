import { Importers } from 'meteor/rocketchat:importer';
import { HipChatEnterpriseImporterInfo } from '../info';
import { HipChatEnterpriseImporter } from './importer';

Importers.add(new HipChatEnterpriseImporterInfo(), HipChatEnterpriseImporter);
