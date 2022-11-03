import { Importers } from '../../importer/client';
import { SlackImporterInfo } from '../lib/info';

Importers.add(new SlackImporterInfo());
