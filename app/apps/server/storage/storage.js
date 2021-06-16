import { AppStorage } from '@rocket.chat/apps-engine/server/storage';

export class AppRealStorage extends AppStorage {
	constructor(data) {
		super('mongodb');
		this.db = data;
	}

	async create(item) {
		item.createdAt = new Date();
		item.updatedAt = new Date();

		const doc = this.db.findOne({ $or: [{ id: item.id }, { 'info.nameSlug': item.info.nameSlug }] });

		if (doc) {
			throw new Error('App already exists.');
		}

		const id = this.db.insert(item);
		item._id = id;

		return item;
	}

	async retrieveOne(id) {
		return this.db.findOne({ $or: [{ _id: id }, { id }] });
	}

	async retrieveAll() {
		const docs = this.db.find({}).fetch();

		const items = new Map();

		docs.forEach((i) => items.set(i.id, i));

		return items;
	}

	async update(item) {
		return this.db.raw.findAndModify(
			{ id: item.id },
			null,
			{ $set: item },
			{ new: true },
		).then(({ value }) => value);
	}

	async remove(id) {
		this.db.remove({ id });
		return { success: true };
	}
}
