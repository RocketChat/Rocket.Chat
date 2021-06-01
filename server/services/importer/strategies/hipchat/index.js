import { HipChatEnterpriseImporter } from './importer';
import { Importers } from '../..';
import { HipChatEnterpriseImporterInfo } from './info';

Importers.add(new HipChatEnterpriseImporterInfo(), HipChatEnterpriseImporter);
