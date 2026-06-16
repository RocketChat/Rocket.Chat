import type { PexipLayout, PexipSettings } from '@rocket.chat/pexip';

import { settingsRegistry, settings } from '../../app/settings/server';

export function createPexipSettings(): Promise<void> {
	return settingsRegistry.addGroup('Pexip_Integration', async function () {
		await this.add('Pexip_Integration_Enabled', false, {
			type: 'boolean',
			public: true,
			invalidValue: false,
			i18nDescription: `Pexip_Integration_Enabled_Description`,
		});

		await this.add('Pexip_Integration_Base_Url', '', {
			type: 'string',
			public: true,
			invalidValue: '',
			i18nDescription: `Pexip_Integration_Base_Url_Description`,
		});

		await this.add('Pexip_Integration_Meeting_Url', '/webapp/conference?conference={callId}', {
			type: 'string',
			public: true,
			invalidValue: '',
			i18nDescription: `Pexip_Integration_Meeting_Url_Description`,
		});

		await this.section('Pexip_Integration_API', async function () {
			await this.add('Pexip_Integration_API_Username', '', {
				type: 'string',
				public: false,
				invalidValue: '',
				i18nDescription: `Pexip_Integration_API_Username_Description`,
			});

			await this.add('Pexip_Integration_API_Password', '', {
				type: 'password',
				public: false,
				invalidValue: '',
				i18nDescription: `Pexip_Integration_API_Password_Description`,
			});
		});

		await this.section('Pexip_Integration_Pins', async function () {
			await this.add('Pexip_Integration_Host_Pin', '', {
				type: 'string',
				public: false,
				invalidValue: '',
				i18nDescription: `Pexip_Integration_Host_Pin_Description`,
			});

			await this.add('Pexip_Integration_Guest_Pin', '', {
				type: 'string',
				public: false,
				invalidValue: '',
				i18nDescription: `Pexip_Integration_Guest_Pin_Description`,
			});
		});

		await this.section('Pexip_Integration_Customization', async function () {
			await this.add('Pexip_Integration_Theme_Name', 'rocket.chat', {
				type: 'string',
				public: true,
				invalidValue: '',
				i18nDescription: `Pexip_Integration_Theme_Name_Description`,
			});

			await this.add('Pexip_Integration_Locked', true, {
				type: 'boolean',
				public: true,
				invalidValue: true,
				i18nDescription: `Pexip_Integration_Locked_Description`,
			});

			await this.add('Pexip_Integration_Overlay_Text', true, {
				type: 'boolean',
				public: true,
				invalidValue: true,
				i18nDescription: `Pexip_Integration_Overlay_Text_Description`,
			});

			await this.add('Pexip_Integration_Meeting_Layout', 'one_main_seven_pips', {
				type: 'select',
				public: true,
				invalidValue: 'one_main_seven_pips',
				i18nDescription: `Pexip_Integration_Meeting_Layout_Description`,
				values: [
					{ key: 'five_mains_seven_pips', i18nLabel: 'Pexip_Integration_Meeting_Layout_five_mains_seven_pips' },
					{ key: 'one_main_zero_pips', i18nLabel: 'Pexip_Integration_Meeting_Layout_one_main_zero_pips' },
					{ key: 'one_main_seven_pips', i18nLabel: 'Pexip_Integration_Meeting_Layout_one_main_seven_pips' },
					{ key: 'one_main_twentyone_pips', i18nLabel: 'Pexip_Integration_Meeting_Layout_one_main_twentyone_pips' },
					{ key: 'one_main_thirtythree_pips', i18nLabel: 'Pexip_Integration_Meeting_Layout_one_main_thirtythree_pips' },
					{ key: 'two_mains_twentyone_pips', i18nLabel: 'Pexip_Integration_Meeting_Layout_two_mains_twentyone_pips' },
					{ key: 'four_mains_zero_pips', i18nLabel: 'Pexip_Integration_Meeting_Layout_four_mains_zero_pips' },
					{ key: 'nine_mains_zero_pips', i18nLabel: 'Pexip_Integration_Meeting_Layout_nine_mains_zero_pips' },
					{ key: 'sixteen_mains_zero_pips', i18nLabel: 'Pexip_Integration_Meeting_Layout_sixteen_mains_zero_pips' },
					{ key: 'twentyfive_mains_zero_pips', i18nLabel: 'Pexip_Integration_Meeting_Layout_twentyfive_mains_zero_pips' },
				],
			});
		});

		await this.section('Pexip_Integration_SIP', async function () {
			await this.add('Pexip_Integration_SIP_AddAlias', false, {
				type: 'boolean',
				public: true,
				invalidValue: '',
				i18nDescription: `Pexip_Integration_SIP_AddAlias_Description`,
			});

			await this.add('Pexip_Integration_SIP_Host', '', {
				type: 'string',
				public: true,
				invalidValue: '',
				i18nDescription: `Pexip_Integration_SIP_Host_Description`,
			});

			await this.add('Pexip_Integration_SIP_Port', 5060, {
				type: 'int',
				public: true,
				invalidValue: '',
				i18nDescription: `Pexip_Integration_SIP_Port_Description`,
			});
		});
	});
}

export function getPexipSettings(): PexipSettings {
	return {
		enabled: settings.get<boolean>('Pexip_Integration_Enabled'),
		baseUrl: settings.get<string>('Pexip_Integration_Base_Url'),
		meetingUrl: settings.get<string>('Pexip_Integration_Meeting_Url'),
		api: {
			username: settings.get<string>('Pexip_Integration_API_Username'),
			password: settings.get<string>('Pexip_Integration_API_Password'),
		},
		pins: {
			host: settings.get<string>('Pexip_Integration_Host_Pin'),
			guest: settings.get<string>('Pexip_Integration_Guest_Pin'),
		},
		customization: {
			themeName: settings.get<string>('Pexip_Integration_Theme_Name'),
			locked: settings.get<boolean>('Pexip_Integration_Locked'),
			overlayText: settings.get<boolean>('Pexip_Integration_Overlay_Text'),
			meetingLayout: settings.get<PexipLayout>('Pexip_Integration_Meeting_Layout'),
		},
		workspace: {
			siteUrl: settings.get<string>('Site_Url'),
			discussionsEnabled: settings.get<boolean>('Discussion_enabled'),
			persistentChatEnabled: settings.get<boolean>('VideoConf_Enable_Persistent_Chat'),
		},
		sip: {
			addAlias: settings.get<boolean>('Pexip_Integration_SIP_AddAlias'),
			host: settings.get<string>('Pexip_Integration_SIP_Host'),
			port: settings.get<number>('Pexip_Integration_SIP_Port'),
		},
	};
}
