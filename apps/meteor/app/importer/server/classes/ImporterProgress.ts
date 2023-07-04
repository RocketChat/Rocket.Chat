import type { IImportProgress } from '@rocket.chat/core-typings';

import { ProgressStep } from '../../lib/ImporterProgressStep';

export class Progress implements IImportProgress {
	public key: string;

	public name: string;

	public step: IImportProgress['step'];

	public count: {
		completed: number;
		total: number;
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
		this.count = { completed: 0, total: 0 };
	}
}
