Importer.AddImporter 'slack', Importer.Slack,
	name: 'Slack'
	description: TAPi18n.__('Importer_From_Description', { from: 'Slack' })
	fileTypeRegex: new RegExp 'application\/.*?zip'
