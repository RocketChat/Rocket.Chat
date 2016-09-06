Importer.AddImporter 'hipchat', Importer.HipChat,
	name: 'HipChat'
	description: TAPi18n.__('Importer_From_Description', { from: 'HipChat' })
	fileTypeRegex: new RegExp 'application\/.*?zip'
