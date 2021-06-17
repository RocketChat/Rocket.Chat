import { SlackImporter } from './importer';
import { Importers } from '../..';
import { SlackImporterInfo } from './info';

Importers.add(new SlackImporterInfo(), SlackImporter);
