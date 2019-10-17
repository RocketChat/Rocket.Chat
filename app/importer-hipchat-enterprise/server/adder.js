import { HipChatEnterpriseImporter } from './importer';
import { Importers } from '../../importer/server';
import { HipChatEnterpriseImporterInfo } from '../lib/info';

Importers.add(new HipChatEnterpriseImporterInfo(), HipChatEnterpriseImporter);
