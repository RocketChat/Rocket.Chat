import { ImporterInfo } from 'meteor/rocketchat:importer';

export class HipChatImporterInfo extends ImporterInfo {
	constructor() {
		super('hipchat', 'HipChat', 'application/zip');
	}
}
