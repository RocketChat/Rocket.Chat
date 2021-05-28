import { Base } from './_Base';

class ImportsModel extends Base {
	constructor() {
		super('import');
	}

	findLastImport() {
		const imports = this.find({}, { sort: { ts: -1 }, limit: 1 }).fetch();

		if (imports && imports.length) {
			return imports.shift();
		}

		return undefined;
	}

	invalidateAllOperations() {
		this.update({ valid: { $ne: false } }, { $set: { valid: false } }, { multi: true });
	}

	invalidateOperationsExceptId(id) {
		this.update({ valid: { $ne: false }, _id: { $ne: id } }, { $set: { valid: false } }, { multi: true });
	}

	invalidateOperationsNotInStatus(status) {
		const statusList = [].concat(status);

		this.update({ valid: { $ne: false }, status: { $nin: statusList } }, { $set: { valid: false } }, { multi: true });
	}

	findAllPendingOperations(options = {}) {
		return this.find({ valid: true }, options);
	}
}

export default new ImportsModel();
