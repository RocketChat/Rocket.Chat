import type { IImportProgress } from '@rocket.chat/core-typings';

import { ProgressStep } from '../../lib/ImporterProgressStep';

export class ImporterProgress implements IImportProgress {
	public key: string;

	public name: string;

	public step: IImportProgress['step'];

	public count: {
		completed: number;
		total: number;
		error: number;
	};

	/**
	 * Creates a new progress container for the importer.
	 *
	 * @param {string} key The unique key of the importer.
	 * @param {string} name The name of the importer.
	 */
	constructor(key: string, name: string) {
		this.key = key;
		this.name = name;
		this.step = ProgressStep.NEW;
		this.count = { completed: 0, total: 0, error: 0 };
	}
}
