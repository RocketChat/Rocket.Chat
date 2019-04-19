import { ImporterInfo } from '../../importer/lib/ImporterInfo';

export class SlackImporterInfo extends ImporterInfo {
	constructor() {
		super('slack', 'Slack', 'application/zip');
	}
}
