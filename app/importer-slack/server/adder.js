import { SlackImporter } from './importer';
import { Importers } from '../../old-importer/server';
import { SlackImporterInfo } from '../lib/info';

Importers.add(new SlackImporterInfo(), SlackImporter);
