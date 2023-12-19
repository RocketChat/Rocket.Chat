import { check } from 'meteor/check';
import { Mongo } from 'meteor/mongo';
import type { Document } from 'mongodb';

export abstract class Base<T extends Document = any> {
	private model: Mongo.Collection<T>;

	protected _baseName() {
		return 'rocketchat_';
	}

	protected _initModel(name: string) {
		check(name, String);
		this.model = new Mongo.Collection(this._baseName() + name);
		return this.model;
	}

	find(...args: Parameters<Mongo.Collection<T>['find']>) {
		return this.model.find(...args);
	}

	findOne(...args: Parameters<Mongo.Collection<T>['findOne']>) {
		return this.model.findOne(...args);
	}

	insert(...args: Parameters<Mongo.Collection<T>['insert']>) {
		return this.model.insert(...args);
	}

	update(...args: Parameters<Mongo.Collection<T>['update']>) {
		return this.model.update(...args);
	}

	upsertAsync(...args: Parameters<Mongo.Collection<T>['upsert']>) {
		return this.model.upsertAsync(...args);
	}

	remove(...args: Parameters<Mongo.Collection<T>['remove']>) {
		return this.model.remove(...args);
	}

	allow(...args: Parameters<Mongo.Collection<T>['allow']>) {
		return this.model.allow(...args);
	}

	deny(...args: Parameters<Mongo.Collection<T>['deny']>) {
		return this.model.deny(...args);
	}

	ensureIndex() {
		// do nothing
	}

	dropIndex() {
		// do nothing
	}

	tryEnsureIndex() {
		// do nothing
	}

	tryDropIndex() {
		// do nothing
	}
}
