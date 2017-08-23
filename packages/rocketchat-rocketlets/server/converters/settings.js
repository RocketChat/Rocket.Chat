export class RocketletSettingsConverter {
	constructor(orch) {
		this.orch = orch;
	}

	convertById(settingId) {
		const setting = RocketChat.models.Settings.findOneById(settingId);

		return {
			id: setting._id
		};
	}
}
