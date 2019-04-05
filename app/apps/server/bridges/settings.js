import { Settings } from '../../../models';

export class AppSettingBridge {
	constructor(orch) {
		this.orch = orch;
		this.allowedGroups = [];
	}

	async getAll(appId) {
		this.orch.debugLog(`The App ${ appId } is getting all the settings.`);

		return Settings.find({ secret: false })
			.fetch()
			.map((s) => this.orch.getConverters().get('settings').convertToApp(s));
	}

	async getOneById(id, appId) {
		this.orch.debugLog(`The App ${ appId } is getting the setting by id ${ id }.`);

		if (!this.isReadableById(id, appId)) {
			throw new Error(`The setting "${ id }" is not readable.`);
		}

		return this.orch.getConverters().get('settings').convertById(id);
	}

	async hideGroup(name, appId) {
		this.orch.debugLog(`The App ${ appId } is hidding the group ${ name }.`);

		throw new Error('Method not implemented.');
	}

	async hideSetting(id, appId) {
		this.orch.debugLog(`The App ${ appId } is hidding the setting ${ id }.`);

		if (!this.isReadableById(id, appId)) {
			throw new Error(`The setting "${ id }" is not readable.`);
		}

		throw new Error('Method not implemented.');
	}

	async isReadableById(id, appId) {
		this.orch.debugLog(`The App ${ appId } is checking if they can read the setting ${ id }.`);

		return !RocketChat.models.Settings.findOneById(id).secret;
	}

	async updateOne(setting, appId) {
		this.orch.debugLog(`The App ${ appId } is updating the setting ${ setting.id } .`);

		if (!this.isReadableById(setting.id, appId)) {
			throw new Error(`The setting "${ setting.id }" is not readable.`);
		}

		throw new Error('Method not implemented.');
	}
}
