import { Importers } from '../../importer';
import { HipChatImporterInfo } from '../lib/info';
import { HipChatImporter } from './importer';

Importers.add(new HipChatImporterInfo(), HipChatImporter);
