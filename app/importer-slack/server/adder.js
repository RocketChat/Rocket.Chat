import { SlackImporter } from './importer';
import { SlackImageImporter } from './imageDownloader';
import { Importers } from '../../importer/server';
import { SlackImporterInfo, SlackImageImporterInfo } from '../lib/info';

Importers.add(new SlackImporterInfo(), SlackImporter);
Importers.add(new SlackImageImporterInfo(), SlackImageImporter);
