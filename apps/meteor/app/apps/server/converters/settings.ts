import { SettingType, ISetting as ISettingFromAppsEngine } from '@rocket.chat/apps-engine/definition/settings';
import type { ISetting } from '@rocket.chat/core-typings';

import { Settings } from '../../../models/server/raw';
import { AppServerOrchestrator } from '../orchestrator';

export class AppSettingsConverter {
	orch: AppServerOrchestrator;

	constructor(orch: AppServerOrchestrator) {
		this.orch = orch;
	}

	async convertById(settingId: string): Promise<ISettingFromAppsEngine> {
		const setting = await Settings.findOneNotHiddenById(settingId);

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return this.convertToApp(setting!);
	}

	convertToApp(setting: ISetting): ISettingFromAppsEngine {
		return {
			id: setting._id,
			type: this._convertTypeToApp(setting.type),
			packageValue: setting.packageValue,
			values: setting.values as ISettingFromAppsEngine['values'],
			value: setting.value,
			public: setting.public,
			hidden: setting.hidden,
			i18nLabel: setting.i18nLabel,
			i18nDescription: setting.i18nDescription,
			createdAt: setting.ts,
			updatedAt: setting._updatedAt,
			...({ group: setting.group } as any),
		};
	}

	_convertTypeToApp(type: string): SettingType {
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
				return type as SettingType;
		}
	}
}
