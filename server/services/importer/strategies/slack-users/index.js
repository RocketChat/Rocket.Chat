import { SlackUsersImporter } from './importer';
import { Importers } from '../..';
import { SlackUsersImporterInfo } from './info';

Importers.add(new SlackUsersImporterInfo(), SlackUsersImporter);
