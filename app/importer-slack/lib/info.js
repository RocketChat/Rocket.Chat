import { ImporterInfo } from '../../importer/lib/ImporterInfo';

export class SlackImporterInfo extends ImporterInfo {
	constructor() {
		super('slack', 'Slack', 'application/zip');
	}
}

export class SlackFileImporterInfo extends ImporterInfo {
	constructor() {
		super('slack-files', 'Slack Files', '');
	}
}
