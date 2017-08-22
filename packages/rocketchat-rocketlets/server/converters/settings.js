export class RocketletSettingsConverter {
	constructor(converters) {
		this.converters = converters;
	}

	convertById(settingId) {
		const setting = RocketChat.models.Settings.findOneById(settingId);

		return {
			id: setting._id
		};
	}
}
