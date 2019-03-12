import { ImporterInfo } from '/app/importer';

export class HipChatImporterInfo extends ImporterInfo {
	constructor() {
		super('hipchat', 'HipChat (zip)', 'application/zip');
	}
}
