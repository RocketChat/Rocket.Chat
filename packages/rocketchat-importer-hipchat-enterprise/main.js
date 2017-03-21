/* globals Importer */

Importer.addImporter('hipchatenterprise', Importer.HipChatEnterprise, {
	name: 'HipChat Enterprise',
	warnings: [
		{
			text: 'Importer_HipChatEnterprise_Information',
			href: 'https://rocket.chat/docs/administrator-guides/import/hipchat/enterprise/'
		}, {
			text: 'Importer_HipChatEnterprise_BetaWarning',
			href: 'https://github.com/RocketChat/Rocket.Chat/issues/new'
		}
	],
	mimeType: 'application/gzip'
});
