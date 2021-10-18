import { PendingFileImporter } from './importer';
import { Importers } from '../../importer/server';
import { PendingFileImporterInfo } from './info';

Importers.add(new PendingFileImporterInfo(), PendingFileImporter);
