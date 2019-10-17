import { ImporterInfo } from '../../importer/lib/ImporterInfo';

export class HipChatImporterInfo extends ImporterInfo {
	constructor() {
		super('hipchat', 'HipChat (zip)', 'application/zip');
	}
}
