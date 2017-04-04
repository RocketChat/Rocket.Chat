RocketChat.models._Base = class {

	_baseName() {
		return 'rocketchat_';
	}

	_initModel(name) {
		check(name, String);
		return this.model = new Mongo.Collection(this._baseName() + name);
	}

	find() {
		return this.model.find.apply(this.model, arguments);
	}

	findOne() {
		return this.model.findOne.apply(this.model, arguments);
	}

	insert() {
		return this.model.insert.apply(this.model, arguments);
	}

	update() {
		return this.model.update.apply(this.model, arguments);
	}

	upsert() {
		return this.model.upsert.apply(this.model, arguments);
	}

	remove() {
		return this.model.remove.apply(this.model, arguments);
	}

	allow() {
		return this.model.allow.apply(this.model, arguments);
	}

	deny() {
		return this.model.deny.apply(this.model, arguments);
	}

	ensureIndex() {}

	dropIndex() {}

	tryEnsureIndex() {}

	tryDropIndex() {}

};
