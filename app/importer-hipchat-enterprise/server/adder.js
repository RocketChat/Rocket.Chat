import { HipChatEnterpriseImporter } from './importer';
import { Importers } from '../../old-importer/server';
import { HipChatEnterpriseImporterInfo } from '../lib/info';

Importers.add(new HipChatEnterpriseImporterInfo(), HipChatEnterpriseImporter);
