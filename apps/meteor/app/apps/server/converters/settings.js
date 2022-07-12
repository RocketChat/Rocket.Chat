import { SettingType } from '@rocket.chat/apps-engine/definition/settings';
import { Settings } from '@rocket.chat/models';

export class AppSettingsConverter {
	constructor(orch) {
		this.orch = orch;
	}

	async convertById(settingId) {
		const setting = await Settings.findOneNotHiddenById(settingId);

		return this.convertToApp(setting);
	}

	convertToApp(setting) {
		return {
			id: setting._id,
			type: this._convertTypeToApp(setting.type),
			packageValue: setting.packageValue,
			values: setting.values,
			value: setting.value,
			public: setting.public,
			hidden: setting.hidden,
			group: setting.group,
			i18nLabel: setting.i18nLabel,
			i18nDescription: setting.i18nDescription,
			createdAt: setting.ts,
			updatedAt: setting._updatedAt,
		};
	}

	_convertTypeToApp(type) {
		switch (type) {
			case 'boolean':
				return SettingType.BOOLEAN;
			case 'code':
				return SettingType.CODE;
			case 'color':
				return SettingType.COLOR;
			case 'font':
				return SettingType.FONT;
			case 'int':
				return SettingType.NUMBER;
			case 'select':
				return SettingType.SELECT;
			case 'string':
				return SettingType.STRING;
			default:
				return type;
		}
	}
}
