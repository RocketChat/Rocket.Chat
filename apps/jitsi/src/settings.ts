import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
	JitsiDomain = 'jitsi_domain',
	JitsiTitlePrefix = 'jitsi_title_prefix',
	JitsiTitleSuffix = 'jitsi_title_suffix',
	JitsiRoomIdType = 'jitsi_room_id_type',
	JitsiSSL = 'jitsi_ssl',
	JitsiChromeExtension = 'jitsi_chrome_extension',
}

export const settings: Array<ISetting> = [
	{
		id: AppSetting.JitsiDomain,
		type: SettingType.STRING,
		packageValue: 'meet.jit.si',
		required: true,
		public: true,
		i18nLabel: AppSetting.JitsiDomain,
		i18nDescription: `${AppSetting.JitsiDomain}_description`,
	},
	{
		id: AppSetting.JitsiTitlePrefix,
		type: SettingType.STRING,
		packageValue: 'RocketChat',
		required: false,
		public: true,
		i18nLabel: AppSetting.JitsiTitlePrefix,
		i18nDescription: `${AppSetting.JitsiTitlePrefix}_description`,
	},
	{
		id: AppSetting.JitsiTitleSuffix,
		type: SettingType.STRING,
		packageValue: '',
		required: false,
		public: true,
		i18nLabel: AppSetting.JitsiTitleSuffix,
		i18nDescription: `${AppSetting.JitsiTitleSuffix}_description`,
	},
	{
		id: AppSetting.JitsiRoomIdType,
		type: SettingType.SELECT,
		packageValue: 'call',
		required: false,
		public: true,
		i18nLabel: AppSetting.JitsiRoomIdType,
		i18nDescription: `${AppSetting.JitsiRoomIdType}_description`,
		values: [
			{
				key: 'id',
				i18nLabel: `${AppSetting.JitsiRoomIdType}_id`,
			},
			{
				key: 'call',
				i18nLabel: `${AppSetting.JitsiRoomIdType}_call`,
			},
			{
				key: 'title',
				i18nLabel: `${AppSetting.JitsiRoomIdType}_title`,
			},
		],
	},
	{
		id: AppSetting.JitsiSSL,
		type: SettingType.BOOLEAN,
		packageValue: true,
		required: false,
		public: true,
		i18nLabel: AppSetting.JitsiSSL,
		i18nDescription: `${AppSetting.JitsiSSL}_description`,
	},
	{
		id: AppSetting.JitsiChromeExtension,
		type: SettingType.STRING,
		packageValue: 'nocfbnnmjnndkbipkabodnheejiegccf',
		required: false,
		public: true,
		i18nLabel: AppSetting.JitsiChromeExtension,
		i18nDescription: `${AppSetting.JitsiChromeExtension}_description`,
	}
];
