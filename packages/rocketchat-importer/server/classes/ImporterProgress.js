import { ProgressStep } from '../../lib/ImporterProgressStep';

export class Progress {
	constructor(key, name) {
		this.key = key;
		this.name = name;
		this.step = ProgressStep.NEW;
		this.count = { completed: 0, total: 0 };
	}
}
