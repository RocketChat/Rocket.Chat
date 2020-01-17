import { Importers } from '../../old-importer/client';
import { SlackImporterInfo } from '../lib/info';

Importers.add(new SlackImporterInfo());
