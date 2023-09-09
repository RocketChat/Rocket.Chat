import { Importers } from '../../importer/server';
import { PendingAvatarImporter } from './importer';
import { PendingAvatarImporterInfo } from './info';

Importers.add(new PendingAvatarImporterInfo(), PendingAvatarImporter);
