import { settingsRegistry } from '../../app/settings/server';

export const createSlackBridgeSettings = () =>
	settingsRegistry.addGroup('SlackBridge', async function () {
		await this.add('SlackBridge_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			public: true,
		});

		await this.add('SlackBridge_UseLegacy', true, {
			type: 'boolean',
			enableQuery: {
				_id: 'SlackBridge_Enabled',
				value: true,
			},
			i18nLabel: 'SlackBridge_UseLegacy',
			i18nDescription: 'SlackBridge_UseLegacy_Description',
			public: true,
			packageValue: true,
		});

		await this.add('SlackBridge_APIToken', '', {
			type: 'string',
			multiline: true,
			enableQuery: [
				{
					_id: 'SlackBridge_UseLegacy',
					value: true,
				},
				{
					_id: 'SlackBridge_Enabled',
					value: true,
				},
			],
			i18nLabel: 'SlackBridge_APIToken',
			i18nDescription: 'SlackBridge_APIToken_Description',
			secret: true,
		});

		await this.add('SlackBridge_BotToken', '', {
			type: 'string',
			multiline: true,
			enableQuery: [
				{
					_id: 'SlackBridge_UseLegacy',
					value: false,
				},
				{
					_id: 'SlackBridge_Enabled',
					value: true,
				},
			],
			i18nLabel: 'SlackBridge_BotToken',
			i18nDescription: 'SlackBridge_BotToken_Description',
			secret: true,
		});

		await this.add('SlackBridge_SigningSecret', '', {
			type: 'string',
			multiline: true,
			enableQuery: [
				{
					_id: 'SlackBridge_UseLegacy',
					value: false,
				},
				{
					_id: 'SlackBridge_Enabled',
					value: true,
				},
			],
			i18nLabel: 'SlackBridge_SigningSecret',
			i18nDescription: 'SlackBridge_SigningSecret_Description',
			secret: true,
		});

		await this.add('SlackBridge_AppToken', '', {
			type: 'string',
			multiline: true,
			enableQuery: [
				{
					_id: 'SlackBridge_UseLegacy',
					value: false,
				},
				{
					_id: 'SlackBridge_Enabled',
					value: true,
				},
			],
			i18nLabel: 'SlackBridge_AppToken',
			i18nDescription: 'SlackBridge_AppToken_Description',
			secret: true,
		});

		await this.add('SlackBridge_FileUpload_Enabled', true, {
			type: 'boolean',
			enableQuery: {
				_id: 'SlackBridge_Enabled',
				value: true,
			},
			i18nLabel: 'FileUpload',
		});

		await this.add('SlackBridge_Out_Enabled', false, {
			type: 'boolean',
			enableQuery: {
				_id: 'SlackBridge_Enabled',
				value: true,
			},
		});

		await this.add('SlackBridge_Out_All', false, {
			type: 'boolean',
			enableQuery: [
				{
					_id: 'SlackBridge_Enabled',
					value: true,
				},
				{
					_id: 'SlackBridge_Out_Enabled',
					value: true,
				},
			],
		});

		await this.add('SlackBridge_Out_Channels', '', {
			type: 'roomPick',
			enableQuery: [
				{
					_id: 'SlackBridge_Enabled',
					value: true,
				},
				{
					_id: 'SlackBridge_Out_Enabled',
					value: true,
				},
				{
					_id: 'SlackBridge_Out_All',
					value: false,
				},
			],
		});

		await this.add('SlackBridge_AliasFormat', '', {
			type: 'string',
			enableQuery: {
				_id: 'SlackBridge_Enabled',
				value: true,
			},
			i18nLabel: 'Alias_Format',
			i18nDescription: 'Alias_Format_Description',
		});

		await this.add('SlackBridge_ExcludeBotnames', '', {
			type: 'string',
			enableQuery: {
				_id: 'SlackBridge_Enabled',
				value: true,
			},
			i18nLabel: 'Exclude_Botnames',
			i18nDescription: 'Exclude_Botnames_Description',
		});

		await this.add('SlackBridge_Reactions_Enabled', true, {
			type: 'boolean',
			enableQuery: {
				_id: 'SlackBridge_Enabled',
				value: true,
			},
			i18nLabel: 'Reactions',
		});

		await this.add('SlackBridge_Remove_Channel_Links', 'removeSlackBridgeChannelLinks', {
			type: 'action',
			actionText: 'Remove_Channel_Links',
			i18nDescription: 'SlackBridge_Remove_Channel_Links_Description',
			enableQuery: {
				_id: 'SlackBridge_Enabled',
				value: true,
			},
		});
	});
