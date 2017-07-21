/* globals Importer */
// Class for all the progress of the importers to use.
Importer.Progress = (Importer.Progress = class Progress {
	// Constructs a new progress object.
	//
	// @param [String] name the name of the Importer
	//
	constructor(name) {
		this.name = name;
		this.step = Importer.ProgressStep.NEW;
		this.count = { completed: 0, total: 0 };
	}
});
