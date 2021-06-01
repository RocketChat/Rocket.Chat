import { PendingAvatarImporter } from './importer';
import { Importers } from '../..';
import { PendingAvatarImporterInfo } from './info';

Importers.add(new PendingAvatarImporterInfo(), PendingAvatarImporter);
