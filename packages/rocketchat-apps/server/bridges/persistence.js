export class AppPersistenceBridge {
	constructor(orch) {
		this.orch = orch;
	}

	purge(appId) {
		console.log(`The App's persistent storage is being purged: ${ appId }`);

		this.orch.getPersistenceModel().remove({ appId });
	}

	create(data, appId) {
		console.log(`The App ${ appId } is storing a new object in their persistence.`, data);

		if (typeof data !== 'object') {
			throw new Error('Attempted to store an invalid data type, it must be an object.');
		}

		return this.orch.getPersistenceModel().insert({ appId, data });
	}

	createWithAssociations(data, associations, appId) {
		console.log(`The App ${ appId } is storing a new object in their persistence that is associated with some models.`, data, associations);

		if (typeof data !== 'object') {
			throw new Error('Attempted to store an invalid data type, it must be an object.');
		}

		return this.orch.getPersistenceModel().insert({ appId, associations, data });
	}

	readById(id, appId) {
		console.log(`The App ${ appId } is reading their data in their persistence with the id: "${ id }"`);

		const record = this.orch.getPersistenceModel().findOneById(id);

		return record.data;
	}

	readByAssociations(associations, appId) {
		console.log(`The App ${ appId } is searching for records that are associated with the following:`, associations);

		throw new Error('Not implemented.');
	}

	remove(id, appId) {
		console.log(`The App ${ appId } is removing one of their records by the id: "${ id }"`);

		const record = this.orch.getPersistenceModel().findOneById(id);

		if (!record) {
			return undefined;
		}

		this.orch.getPersistenceModel().remove({ _id: id });

		return record.data;
	}

	removeByAssociations(associations, appId) {
		console.log(`The App ${ appId } is removing records with the following associations:`, associations);

		throw new Error('Not implemented.');
	}

	update(id, data, upsert, appId) {
		console.log(`The App ${ appId } is updating the record "${ id }" to:`, data);

		if (typeof data !== 'object') {
			throw new Error('Attempted to store an invalid data type, it must be an object.');
		}

		throw new Error('Not implemented.');
	}
}
