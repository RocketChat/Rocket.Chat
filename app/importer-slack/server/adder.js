import { SlackImporter } from './importer';
import { SlackFileImporter } from './fileDownloader';
import { Importers } from '../../importer/server';
import { SlackImporterInfo, SlackFileImporterInfo } from '../lib/info';

Importers.add(new SlackImporterInfo(), SlackImporter);
Importers.add(new SlackFileImporterInfo(), SlackFileImporter);
