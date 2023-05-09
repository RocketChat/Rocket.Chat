import { PendingAvatarImporter } from './importer';
import { Importers } from '../../importer/server';
import { PendingAvatarImporterInfo } from './info';

Importers.add(new PendingAvatarImporterInfo(), PendingAvatarImporter);
