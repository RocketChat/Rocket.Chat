import { Importers } from '../../importer/client';
import { ImporterInfo } from '../../../common/importer/ImporterInfo';

export class SlackImporterInfo extends ImporterInfo {
	constructor() {
		super('slack', 'Slack', 'application/zip');
	}
}

Importers.add(new SlackImporterInfo());
