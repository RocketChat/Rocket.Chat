import type { IAppServerOrchestrator, IAppSettingsConverter, IAppsSetting } from '@rocket.chat/apps';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';
import type { ISetting } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

export class AppSettingsConverter implements IAppSettingsConverter {
	constructor(public orch: IAppServerOrchestrator) {}

	async convertById(settingId: ISetting['_id']): Promise<IAppsSetting> {
		const setting = await Settings.findOneById(settingId);

		return this.convertToApp(setting!);
	}

	convertToApp(setting: ISetting): IAppsSetting {
		return {
			id: setting._id,
			type: this._convertTypeToApp(setting.type),
			packageValue: setting.packageValue,
			values: setting.values as IAppsSetting['values'],
			value: setting.value,
			public: setting.public,
			hidden: setting.hidden,
			...{ group: setting.group }, // FIXME
			i18nLabel: setting.i18nLabel,
			i18nDescription: setting.i18nDescription,
			createdAt: setting.ts,
			updatedAt: setting._updatedAt,
			required: undefined!, // FIXME
		};
	}

	private _convertTypeToApp(type: ISetting['type']): SettingType {
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
