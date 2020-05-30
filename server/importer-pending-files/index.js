import { PendingFileImporter } from './importer';
import { Importers } from '../../app/importer/server';
import { PendingFileImporterInfo } from './info';

Importers.add(new PendingFileImporterInfo(), PendingFileImporter);
