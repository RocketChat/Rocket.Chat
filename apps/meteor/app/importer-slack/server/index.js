import { SlackImporter } from './importer';
import { Importers } from '../../importer/server';
import { SlackImporterInfo } from '../lib/info';

Importers.add(new SlackImporterInfo(), SlackImporter);
