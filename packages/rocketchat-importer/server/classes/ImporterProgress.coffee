# Class for all the progress of the importers to use.
Importer.Progress = class Importer.Progress
	# Constructs a new progress object.
	#
	# @param [String] name the name of the Importer
	#
	constructor: (@name) ->
		@step = Importer.ProgressStep.NEW
		@count = { completed: 0, total: 0 }
