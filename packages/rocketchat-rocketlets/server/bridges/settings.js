export class RocketletSettingBridge {
	constructor(orch) {
		this.orch = orch;
	}

	getAll(rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is getting all the settings.`);
		throw new Error('Method not implemented.');
	}

	getOneById(id, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is getting the setting by id ${ id }.`);
		throw new Error('Method not implemented.');
	}

	hideGroup(name, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is hidding the group ${ name }.`);
		throw new Error('Method not implemented.');
	}

	hideSetting(id, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is hidding the setting ${ id }.`);
		throw new Error('Method not implemented.');
	}

	isReadableById(id, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is checking if they can read the setting ${ id }.`);
		throw new Error('Method not implemented.');
	}

	updateOne(setting, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is updating the setting ${ setting.id } .`);
		throw new Error('Method not implemented.');
	}
}
