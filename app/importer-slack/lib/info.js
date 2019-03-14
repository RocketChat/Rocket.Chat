import { ImporterInfo } from '/app/importer';

export class SlackImporterInfo extends ImporterInfo {
	constructor() {
		super('slack', 'Slack', 'application/zip');
	}
}
