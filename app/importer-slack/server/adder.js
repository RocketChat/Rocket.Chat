import { Importers } from '../../importer/server';
import { SlackImporterInfo } from '../lib/info';
import { SlackImporter } from './importer';

Importers.add(new SlackImporterInfo(), SlackImporter);
