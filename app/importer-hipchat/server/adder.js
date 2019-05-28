import { HipChatImporter } from './importer';
import { Importers } from '../../importer/server';
import { HipChatImporterInfo } from '../lib/info';

Importers.add(new HipChatImporterInfo(), HipChatImporter);
