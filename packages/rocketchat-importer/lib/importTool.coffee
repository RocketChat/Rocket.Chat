Importer.Importers = {}

Importer.AddImporter = (name, importer, options) ->
	if not Importer.Importers[name]?
		Importer.Importers[name] =
			name: options.name
			importer: importer
			fileTypeRegex: options.fileTypeRegex
			description: options.description
