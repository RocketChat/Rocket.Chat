export class RocketletSettingBridge {
	constructor(orch) {
		this.orch = orch;
		this.allowedGroups = [];
		this.allowedSettings = [];
	}

	getAll(rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is getting all the settings.`);
		throw new Error('Method not implemented.');
	}

	getOneById(id, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is getting the setting by id ${ id }.`);

		if (!this.isReadableById(id, rocketletId)) {
			throw new Error(`The setting "${ id }" is not readable.`);
		}

		return this.orch.getConverters().get('settings').convertById(id);
	}

	hideGroup(name, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is hidding the group ${ name }.`);
		throw new Error('Method not implemented.');
	}

	hideSetting(id, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is hidding the setting ${ id }.`);

		if (!this.isReadableById(id, rocketletId)) {
			throw new Error(`The setting "${ id }" is not readable.`);
		}

		throw new Error('Method not implemented.');
	}

	isReadableById(id, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is checking if they can read the setting ${ id }.`);

		return this.allowedSettings.includes(id);
	}

	updateOne(setting, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is updating the setting ${ setting.id } .`);

		if (!this.isReadableById(setting.id, rocketletId)) {
			throw new Error(`The setting "${ setting.id }" is not readable.`);
		}

		throw new Error('Method not implemented.');
	}
}
