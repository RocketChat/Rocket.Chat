import { PendingFileImporter } from './importer';
import { Importers } from '../..';
import { PendingFileImporterInfo } from './info';

Importers.add(new PendingFileImporterInfo(), PendingFileImporter);
