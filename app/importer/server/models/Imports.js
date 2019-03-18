import { ProgressStep } from '../../lib/ImporterProgressStep';
import { Base } from '../../../models';

class ImportsModel extends Base {
	constructor() {
		super('import');
	}

	findPendingImport(key) {
		// Finds the latest import operation
		const data = this.findOne({ importerKey: key }, { createdAt : -1 });
		if (!data || !data.status) {
			return data;
		}

		// But only returns it if it is still pending

		const forbiddenStatus = [
			ProgressStep.DONE,
			ProgressStep.ERROR,
			ProgressStep.CANCELLED,
		];

		if (forbiddenStatus.indexOf(data.status) >= 0) {
			return undefined;
		}

		return data;
	}
}

export const Imports = new ImportsModel();
