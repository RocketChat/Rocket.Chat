import { MessageTypesValues } from '../../app/lib/lib/MessageTypes';
import { settingsRegistry } from '../../app/settings/server';

export const createMessageSettings = () =>
	settingsRegistry.addGroup('Message', async function () {
		await this.section('Message_Attachments', async function () {
			await this.add('Message_Attachments_Thumbnails_Enabled', true, {
				type: 'boolean',
				public: true,
				i18nDescription: 'Message_Attachments_Thumbnails_EnabledDesc',
			});

			await this.add('Message_Attachments_Thumbnails_Width', 480, {
				type: 'int',
				public: true,
				enableQuery: [
					{
						_id: 'Message_Attachments_Thumbnails_Enabled',
						value: true,
					},
				],
			});

			await this.add('Message_Attachments_Thumbnails_Height', 360, {
				type: 'int',
				public: true,
				enableQuery: [
					{
						_id: 'Message_Attachments_Thumbnails_Enabled',
						value: true,
					},
				],
			});

			await this.add('Message_Attachments_Strip_Exif', false, {
				type: 'boolean',
				public: true,
				i18nDescription: 'Message_Attachments_Strip_ExifDescription',
			});
		});
		await this.section('Message_Audio', async function () {
			await this.add('Message_AudioRecorderEnabled', true, {
				type: 'boolean',
				public: true,
				i18nDescription: 'Message_AudioRecorderEnabledDescription',
			});
			await this.add('Message_Audio_bitRate', 32, {
				type: 'int',
				public: true,
			});
		});
		await this.section('Read_Receipts', async function () {
			await this.add('Message_Read_Receipt_Enabled', false, {
				type: 'boolean',
				enterprise: true,
				invalidValue: false,
				modules: ['message-read-receipt'],
				public: true,
			});
			await this.add('Message_Read_Receipt_Store_Users', false, {
				type: 'boolean',
				enterprise: true,
				invalidValue: false,
				modules: ['message-read-receipt'],
				public: true,
				enableQuery: { _id: 'Message_Read_Receipt_Enabled', value: true },
			});
		});
		await this.add('Message_CustomDomain_AutoLink', '', {
			type: 'string',
			public: true,
		});
		await this.add('Message_AllowEditing', true, {
			type: 'boolean',
			public: true,
		});
		await this.add('Message_AllowEditing_BlockEditInMinutes', 0, {
			type: 'int',
			public: true,
			i18nDescription: 'Message_AllowEditing_BlockEditInMinutesDescription',
		});
		await this.add('Message_AllowDeleting', true, {
			type: 'boolean',
			public: true,
		});
		await this.add('Message_AllowDeleting_BlockDeleteInMinutes', 0, {
			type: 'int',
			public: true,
			i18nDescription: 'Message_AllowDeleting_BlockDeleteInMinutes',
		});
		await this.add('Message_AllowUnrecognizedSlashCommand', false, {
			type: 'boolean',
			public: true,
		});
		await this.add('Message_AllowDirectMessagesToYourself', true, {
			type: 'boolean',
			public: true,
		});
		await this.add('Message_AlwaysSearchRegExp', false, {
			type: 'boolean',
		});
		await this.add('Message_ShowDeletedStatus', false, {
			type: 'boolean',
			public: true,
		});
		await this.add('Message_AllowBadWordsFilter', false, {
			type: 'boolean',
			public: true,
		});
		await this.add('Message_BadWordsFilterList', '', {
			type: 'string',
			public: true,
		});
		await this.add('Message_BadWordsWhitelist', '', {
			type: 'string',
			public: true,
		});
		await this.add('Message_KeepHistory', false, {
			type: 'boolean',
			public: true,
		});
		await this.add('Message_MaxAll', 0, {
			type: 'int',
			public: true,
		});
		await this.add('Message_MaxAllowedSize', 5000, {
			type: 'int',
			public: true,
		});
		await this.add('Message_AllowConvertLongMessagesToAttachment', true, {
			type: 'boolean',
			public: true,
		});
		await this.add('Message_GroupingPeriod', 300, {
			type: 'int',
			public: true,
			i18nDescription: 'Message_GroupingPeriodDescription',
		});
		await this.add('API_Embed', true, {
			type: 'boolean',
			public: true,
		});
		await this.add(
			'API_Embed_UserAgent',
			'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36',
			{
				type: 'string',
				public: true,
			},
		);
		await this.add('API_EmbedCacheExpirationDays', 30, {
			type: 'int',
			public: false,
		});
		await this.add('API_Embed_clear_cache_now', 'OEmbedCacheCleanup', {
			type: 'action',
			actionText: 'clear',
			i18nLabel: 'clear_cache_now',
		});
		// TODO: deprecate this setting in favor of App
		await this.add('API_EmbedIgnoredHosts', 'localhost, 127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16', {
			type: 'string',
			i18nDescription: 'API_EmbedIgnoredHosts_Description',
		});
		// TODO: deprecate this setting in favor of App
		await this.add('API_EmbedSafePorts', '80, 443', {
			type: 'string',
		});
		await this.add('Message_TimeFormat', 'LT', {
			type: 'string',
			public: true,
			i18nDescription: 'Message_TimeFormat_Description',
		});
		await this.add('Message_DateFormat', 'LL', {
			type: 'string',
			public: true,
			i18nDescription: 'Message_DateFormat_Description',
		});
		await this.add('Message_TimeAndDateFormat', 'LLL', {
			type: 'string',
			public: true,
			i18nDescription: 'Message_TimeAndDateFormat_Description',
		});
		await this.add('Message_QuoteChainLimit', 2, {
			type: 'int',
			public: true,
		});

		await this.add('Hide_System_Messages', [], {
			type: 'multiSelect',
			public: true,
			values: MessageTypesValues,
		});

		await this.add('DirectMesssage_maxUsers', 8, {
			type: 'int',
			public: true,
		});

		await this.add('Message_ErasureType', 'Delete', {
			type: 'select',
			public: true,
			i18nDescription: 'Message_ErasureType_Description',
			values: [
				{
					key: 'Keep',
					i18nLabel: 'Message_ErasureType_Keep',
				},
				{
					key: 'Delete',
					i18nLabel: 'Message_ErasureType_Delete',
				},
				{
					key: 'Unlink',
					i18nLabel: 'Message_ErasureType_Unlink',
				},
			],
		});

		await this.add(
			'Message_Code_highlight',
			'javascript,css,markdown,dockerfile,json,go,rust,clean,bash,plaintext,powershell,scss,shell,yaml,vim',
			{
				type: 'string',
				public: true,
			},
		);
		await this.add('Message_Auditing_Panel_Load_Count', 0, {
			type: 'int',
			hidden: true,
		});
		await this.add('Message_Auditing_Apply_Count', 0, {
			type: 'int',
			hidden: true,
		});
		await this.add('Message_VideoRecorderEnabled', true, {
			type: 'boolean',
			public: true,
			i18nDescription: 'Message_VideoRecorderEnabledDescription',
		});
		await this.add('AutoTranslate_Enabled', false, {
			type: 'boolean',
			group: 'Message',
			section: 'AutoTranslate',
			public: true,
		});

		await this.add('AutoTranslate_AutoEnableOnJoinRoom', false, {
			type: 'boolean',
			group: 'Message',
			section: 'AutoTranslate',
			public: true,
			enableQuery: [{ _id: 'AutoTranslate_Enabled', value: true }],
		});

		await this.add('AutoTranslate_ServiceProvider', 'google-translate', {
			type: 'select',
			group: 'Message',
			section: 'AutoTranslate',
			values: [
				{
					key: 'google-translate',
					i18nLabel: 'AutoTranslate_Google',
				},
				{
					key: 'deepl-translate',
					i18nLabel: 'AutoTranslate_DeepL',
				},
				{
					key: 'microsoft-translate',
					i18nLabel: 'AutoTranslate_Microsoft',
				},
			],
			enableQuery: [{ _id: 'AutoTranslate_Enabled', value: true }],
			i18nLabel: 'AutoTranslate_ServiceProvider',
			public: true,
		});

		await this.add('AutoTranslate_GoogleAPIKey', '', {
			type: 'string',
			group: 'Message',
			section: 'AutoTranslate_Google',
			public: false,
			i18nLabel: 'AutoTranslate_APIKey',
			enableQuery: [
				{
					_id: 'AutoTranslate_Enabled',
					value: true,
				},
				{
					_id: 'AutoTranslate_ServiceProvider',
					value: 'google-translate',
				},
			],
		});

		await this.add('AutoTranslate_DeepLAPIKey', '', {
			type: 'string',
			group: 'Message',
			section: 'AutoTranslate_DeepL',
			public: false,
			i18nLabel: 'AutoTranslate_APIKey',
			enableQuery: [
				{
					_id: 'AutoTranslate_Enabled',
					value: true,
				},
				{
					_id: 'AutoTranslate_ServiceProvider',
					value: 'deepl-translate',
				},
			],
		});

		await this.add('AutoTranslate_MicrosoftAPIKey', '', {
			type: 'string',
			group: 'Message',
			section: 'AutoTranslate_Microsoft',
			public: false,
			i18nLabel: 'AutoTranslate_Microsoft_API_Key',
			enableQuery: [
				{
					_id: 'AutoTranslate_Enabled',
					value: true,
				},
				{
					_id: 'AutoTranslate_ServiceProvider',
					value: 'microsoft-translate',
				},
			],
		});
		await this.add('HexColorPreview_Enabled', true, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			group: 'Message',
			section: 'Hex_Color_Preview',
			public: true,
		});

		await this.section('Katex', async function () {
			const enableQuery = {
				_id: 'Katex_Enabled',
				value: true,
			};
			await this.add('Katex_Enabled', true, {
				type: 'boolean',
				public: true,
				i18nDescription: 'Katex_Enabled_Description',
			});
			await this.add('Katex_Parenthesis_Syntax', true, {
				type: 'boolean',
				public: true,
				enableQuery,
				i18nDescription: 'Katex_Parenthesis_Syntax_Description',
			});
			await this.add('Katex_Dollar_Syntax', false, {
				type: 'boolean',
				public: true,
				enableQuery,
				i18nDescription: 'Katex_Dollar_Syntax_Description',
			});
		});

		await this.section('Google Maps', async function () {
			await this.add('MapView_Enabled', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'MapView_Enabled',
				i18nDescription: 'MapView_Enabled_Description',
			});
			await this.add('MapView_GMapsAPIKey', '', {
				type: 'string',
				public: true,
				i18nLabel: 'MapView_GMapsAPIKey',
				i18nDescription: 'MapView_GMapsAPIKey_Description',
				secret: true,
			});
		});

		await this.add('Message_AllowPinning', true, {
			type: 'boolean',
			public: true,
		});
		await this.add('Message_AllowStarring', true, {
			type: 'boolean',
			public: true,
		});
	});
