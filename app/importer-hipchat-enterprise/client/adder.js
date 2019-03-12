import { Importers } from 'meteor/rocketchat:importer';
import { HipChatEnterpriseImporterInfo } from '../lib/info';

Importers.add(new HipChatEnterpriseImporterInfo());
