import { check } from 'meteor/check';
import { Mongo } from 'meteor/mongo';

export class Base {
	_baseName() {
		return 'rocketchat_';
	}

	_initModel(name) {
		check(name, String);
		this.model = new Mongo.Collection(this._baseName() + name);
		return this.model;
	}

	find(...args) {
		return this.model.find.apply(this.model, args);
	}

	findOne(...args) {
		return this.model.findOne.apply(this.model, args);
	}

	insert(...args) {
		return this.model.insert.apply(this.model, args);
	}

	update(...args) {
		return this.model.update.apply(this.model, args);
	}

	upsert(...args) {
		return this.model.upsert.apply(this.model, args);
	}

	remove(...args) {
		return this.model.remove.apply(this.model, args);
	}

	allow(...args) {
		return this.model.allow.apply(this.model, args);
	}

	deny(...args) {
		return this.model.deny.apply(this.model, args);
	}

	ensureIndex() {}

	dropIndex() {}

	tryEnsureIndex() {}

	tryDropIndex() {}
}
