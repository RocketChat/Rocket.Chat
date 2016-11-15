Importer.Importers = {}

Importer.addImporter = (name, importer, options) ->
	if not Importer.Importers[name]?
		Importer.Importers[name] =
			name: options.name
			importer: importer
			fileTypeRegex: options.fileTypeRegex
			warnings: options.warnings
