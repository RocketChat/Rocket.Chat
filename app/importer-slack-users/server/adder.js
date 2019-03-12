import { Importers } from '/app/importer';
import { SlackUsersImporterInfo } from '../lib/info';
import { SlackUsersImporter } from './importer';

Importers.add(new SlackUsersImporterInfo(), SlackUsersImporter);
