import { ImporterInfo } from '../../importer/lib/ImporterInfo';

export class HipChatEnterpriseImporterInfo extends ImporterInfo {
	constructor() {
		super('hipchatenterprise', 'HipChat (tar.gz)', 'application/gzip', [
			{
				text: 'Importer_HipChatEnterprise_Information',
				href: 'https://rocket.chat/docs/administrator-guides/import/hipchat/enterprise/',
			},
		]);
	}
}
