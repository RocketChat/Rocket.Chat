import { Importers } from '../../importer/server';
import { SlackUsersImporterInfo } from '../lib/info';
import { SlackUsersImporter } from './importer';

Importers.add(new SlackUsersImporterInfo(), SlackUsersImporter);
