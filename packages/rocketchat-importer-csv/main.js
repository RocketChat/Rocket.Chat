/* globals Importer */

Importer.addImporter('csv', Importer.CSV, {
	name: 'CSV',
	warnings: [{
		text: 'Importer_CSV_Information',
		href: 'https://rocket.chat/docs/administrator-guides/import/csv/'
	}],
	fileTypeRegex: new RegExp('application\/.*?zip')
});
