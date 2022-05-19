import { SettingType } from '@rocket.chat/apps-engine/definition/settings';
import type { ISetting } from '@rocket.chat/core-typings';

import { Settings } from '../../../models/server/raw';
import { AppServerOrchestrator } from '../orchestrator';

export class AppSettingsConverter {
	orch: AppServerOrchestrator;

	constructor(orch: AppServerOrchestrator) {
		this.orch = orch;
	}

	async convertById(settingId: string): Promise<ISetting> {
		const setting = await Settings.findOneNotHiddenById(settingId);

		return this.convertToApp(setting);
	}

	convertToApp(setting: ISetting): ISetting {
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

	_convertTypeToApp(type: string): string {
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
