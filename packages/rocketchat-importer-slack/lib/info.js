import { ImporterInfo } from 'meteor/rocketchat:importer';

export class SlackImporterInfo extends ImporterInfo {
	constructor() {
		super('slack', 'Slack', 'application/zip');
	}
}
