import { HipChatImporter } from './importer';
import { Importers } from '../../old-importer/server';
import { HipChatImporterInfo } from '../lib/info';

Importers.add(new HipChatImporterInfo(), HipChatImporter);
