import { Importers } from 'meteor/rocketchat:importer';
import { HipChatEnterpriseImporterInfo } from '../info';

Importers.add(new HipChatEnterpriseImporterInfo());
