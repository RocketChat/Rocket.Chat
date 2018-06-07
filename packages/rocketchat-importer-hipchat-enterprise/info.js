import { ImporterInfo } from 'meteor/rocketchat:importer';

export class HipChatEnterpriseImporterInfo extends ImporterInfo {
	constructor() {
		super('hipchatenterprise', 'HipChat Enterprise', 'application/gzip', [
			{
				text: 'Importer_HipChatEnterprise_Information',
				href: 'https://rocket.chat/docs/administrator-guides/import/hipchat/enterprise/'
			}, {
				text: 'Importer_HipChatEnterprise_BetaWarning',
				href: 'https://github.com/RocketChat/Rocket.Chat/issues/new'
			}
		]);
	}
}
