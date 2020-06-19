import { AppStorage } from '@rocket.chat/apps-engine/server/storage';

export class AppRealStorage extends AppStorage {
	constructor(data) {
		super('mongodb');
		this.db = data;
	}

	create(item) {
		return new Promise((resolve, reject) => {
			item.createdAt = new Date();
			item.updatedAt = new Date();

			let doc;

			try {
				doc = this.db.findOne({ $or: [{ id: item.id }, { 'info.nameSlug': item.info.nameSlug }] });
			} catch (e) {
				return reject(e);
			}

			if (doc) {
				return reject(new Error('App already exists.'));
			}

			try {
				const id = this.db.insert(item);
				item._id = id;

				resolve(item);
			} catch (e) {
				reject(e);
			}
		});
	}

	retrieveOne(id) {
		return new Promise((resolve, reject) => {
			let doc;

			try {
				doc = this.db.findOne({ $or: [{ _id: id }, { id }] });
			} catch (e) {
				return reject(e);
			}

			resolve(doc);
		});
	}

	retrieveAll() {
		return new Promise((resolve, reject) => {
			let docs;

			try {
				docs = this.db.find({}).fetch();
			} catch (e) {
				return reject(e);
			}

			const items = new Map();

			docs.forEach((i) => items.set(i.id, i));

			resolve(items);
		});
	}

	update(item) {
		return new Promise((resolve, reject) => {
			try {
				this.db.update({ id: item.id }, item);
				resolve(item.id);
			} catch (e) {
				return reject(e);
			}
		}).then(this.retrieveOne.bind(this));
	}

	remove(id) {
		return new Promise((resolve, reject) => {
			try {
				this.db.remove({ id });
			} catch (e) {
				return reject(e);
			}

			resolve({ success: true });
		});
	}
}
