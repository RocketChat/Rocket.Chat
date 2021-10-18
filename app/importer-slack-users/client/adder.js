import { Importers } from '../../importer/client';
import { SlackUsersImporterInfo } from '../lib/info';

Importers.add(new SlackUsersImporterInfo());
