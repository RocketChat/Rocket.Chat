Importer.Importers = {}

Importer.addImporter = (name, importer, options) ->
	if not Importer.Importers[name]?
		Importer.Importers[name] =
			name: options.name
			importer: importer
			mimeType: options.mimeType
			warnings: options.warnings
