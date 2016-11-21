/* globals Importer */

Importer.addImporter('hipchatenterprise', Importer.HipChatEnterprise, {
	name: 'HipChat Enterprise',
	fileTypeRegex: new RegExp('application\/.*?gzip')
});
