export class RocketletPersistenceBridge {
	constructor(orch) {
		this.orch = orch;
	}

	purge(rocketletId) {
		console.log(`The Rocketlet's persistent storage is being purged: ${ rocketletId }`);

		this.orch.getPersistenceModel().remove({ rocketletId });
	}

	create(data, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is storing a new object in their persistence.`, data);

		if (typeof data !== 'object') {
			throw new Error('Attempted to store an invalid data type, it must be an object.');
		}

		return this.orch.getPersistenceModel().insert({ rocketletId, data });
	}

	createWithAssociations(data, associations, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is storing a new object in their persistence that is associated with some models.`, data, associations);

		if (typeof data !== 'object') {
			throw new Error('Attempted to store an invalid data type, it must be an object.');
		}

		return this.orch.getPersistenceModel().insert({ rocketletId, associations, data });
	}

	readById(id, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is reading their data in their persistence with the id: "${ id }"`);

		const record = this.orch.getPersistenceModel().findOneById(id);

		return record.data;
	}

	readByAssociations(associations, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is searching for records that are associated with the following:`, associations);

		throw new Error('Not implemented.');
	}

	remove(id, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is removing one of their records by the id: "${ id }"`);

		const record = this.orch.getPersistenceModel().findOneById(id);

		if (!record) {
			return undefined;
		}

		this.orch.getPersistenceModel().remove({ _id: id });

		return record.data;
	}

	removeByAssociations(associations, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is removing records with the following associations:`, associations);

		throw new Error('Not implemented.');
	}

	update(id, data, upsert, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is updating the record "${ id }" to:`, data);

		if (typeof data !== 'object') {
			throw new Error('Attempted to store an invalid data type, it must be an object.');
		}

		throw new Error('Not implemented.');
	}
}
