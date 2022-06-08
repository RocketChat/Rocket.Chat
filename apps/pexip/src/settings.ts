import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
	PexipBaseUrl = 'pexip_base_url',
}

export const settings: Array<ISetting> = [
	{
		id: AppSetting.PexipBaseUrl,
		type: SettingType.STRING,
		packageValue: '',
		required: true,
		public: true,
		i18nLabel: AppSetting.PexipBaseUrl,
		i18nDescription: `${AppSetting.PexipBaseUrl}_description`,
	},
];
