export class RocketletPersistenceBridge {
	constructor(orch) {
		this.orch = orch;
	}

	create(data, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is storing a new object in their persistence.`, data);

		return this.orch.getPersistenceModel().insert({ rocketletId, data });
	}

	readById(id, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is reading their data in their persistence with the id: "${ id }"`);

		const record = this.orch.getPersistenceModel().findOneById(id);

		return record.data;
	}
}
