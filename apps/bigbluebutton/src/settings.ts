import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
	Url = 'bbb_url',
	Secret = 'bbb_shared_secret',
}

export const settings: Array<ISetting> = [
	{
		id: AppSetting.Url,
		type: SettingType.STRING,
		packageValue: '',
		required: true,
		public: true,
		i18nLabel: AppSetting.Url,
		i18nDescription: `${AppSetting.Url}_description`,
	},
	{
		id: AppSetting.Secret,
		type: SettingType.STRING,
		packageValue: 'RocketChat',
		required: false,
		public: true,
		i18nLabel: AppSetting.Secret,
		i18nDescription: `${AppSetting.Secret}_description`,
	},
];
