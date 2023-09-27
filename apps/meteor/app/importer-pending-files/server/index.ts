import { Importers } from '../../importer/server';
import { PendingFileImporter } from './importer';
import { PendingFileImporterInfo } from './info';

Importers.add(new PendingFileImporterInfo(), PendingFileImporter);
