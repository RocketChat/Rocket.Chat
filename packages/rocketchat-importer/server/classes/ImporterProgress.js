import { ProgressStep } from '../../lib/ImporterProgressStep';

export class Progress {
	/**
	 * Creates a new progress container for the importer.
	 *
	 * @param {string} key The unique key of the importer.
	 * @param {string} name The name of the importer.
	 */
	constructor(key, name) {
		this.key = key;
		this.name = name;
		this.step = ProgressStep.NEW;
		this.count = { completed: 0, total: 0 };
	}
}
