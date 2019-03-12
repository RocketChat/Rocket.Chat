import { Importers } from '/app/importer';
import { HipChatImporterInfo } from '../lib/info';
import { HipChatImporter } from './importer';

Importers.add(new HipChatImporterInfo(), HipChatImporter);
