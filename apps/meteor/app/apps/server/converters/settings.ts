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

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return this.convertToApp(setting!);
	}

	convertToApp(setting: ISetting): ISetting {
		return {
			_id: setting._id,
			type: this._convertTypeToApp(setting.type) as SettingType,
			packageValue: setting.packageValue,
			values: setting.values,
			value: setting.value,
			public: setting.public,
			hidden: setting.hidden,
			group: setting.group,
			i18nLabel: setting.i18nLabel,
			i18nDescription: setting.i18nDescription,
			createdAt: setting.ts,
			_updatedAt: setting._updatedAt,

			blocked: setting.blocked,
			sorter: setting.sorter,
			env: setting.env,
			section: setting.section,
			tab: setting.tab,
			enableQuery: setting.enableQuery,
			displayQuery: setting.displayQuery,
			properties: setting.properties,
			enterprise: setting.enterprise,
			modules: setting.modules,
			invalidValue: setting.invalidValue,
			valueSource: setting.valueSource,
			secret: setting.secret,
			autocomplete: setting.autocomplete,
			processEnvValue: setting.processEnvValue,
			meteorSettingsValue: setting.meteorSettingsValue,
			ts: setting.ts,
			multiline: setting.multiline,
			placeholder: setting.placeholder,
			wizard: setting.wizard,
			persistent: setting.persistent,
			readonly: setting.readonly,
			alert: setting.alert,
			private: setting.private,
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
