import { SlackUsersImporter } from './importer';
import { Importers } from '../../importer/server';
import { SlackUsersImporterInfo } from '../lib/info';

Importers.add(new SlackUsersImporterInfo(), SlackUsersImporter);
