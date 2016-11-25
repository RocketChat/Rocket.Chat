/* globals Importer */

Importer.addImporter('hipchatenterprise', Importer.HipChatEnterprise, {
	name: 'HipChat Enterprise',
	warnings: [{
		text: 'Importer_HipChatEnterprise_Information',
		href: 'https://rocket.chat/docs/administrator-guides/import/hipchat/enterprise/'
	}],
	fileTypeRegex: new RegExp('application\/.*?gzip')
});
