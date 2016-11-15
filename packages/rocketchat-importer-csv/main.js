/* globals Importer */

Importer.addImporter('csv', Importer.CSV, {
	name: 'CSV',
	fileTypeRegex: new RegExp('application\/.*?zip')
});
