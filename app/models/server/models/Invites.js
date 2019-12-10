import { Base } from './_Base';

class Invites extends Base {
	constructor() {
		super('invites');

		this.tryEnsureIndex({ hash: 1 });
	}

	findOneByHash(hash) {
		return this.findOne({ hash });
	}

	// INSERT
	create(data) {
		return this.insert(data);
	}

	// REMOVE
	removeById(_id) {
		return this.remove({ _id });
	}
}

export default new Invites();
