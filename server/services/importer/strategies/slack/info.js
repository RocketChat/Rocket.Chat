import { ImporterInfo } from '../../../../../common/importer/ImporterInfo';

export class SlackImporterInfo extends ImporterInfo {
	constructor() {
		super('slack', 'Slack', 'application/zip');
	}
}
