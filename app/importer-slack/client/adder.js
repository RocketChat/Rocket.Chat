import { Importers } from '/app/importer';
import { SlackImporterInfo } from '../lib/info';

Importers.add(new SlackImporterInfo());
