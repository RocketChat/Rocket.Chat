import { settingsRegistry } from '../../app/settings/server';

export const createCallCenterSettings = () =>
	settingsRegistry.addGroup('VoIP_Omnichannel', async function () {
		// TODO: Check with the backend team if an i18nPlaceholder is possible
		await this.with({ tab: 'Settings' }, async function () {
			await this.section('General_Settings', async function () {
				await this.add('VoIP_Enabled', false, {
					type: 'boolean',
					public: true,
					i18nDescription: 'VoIP_Enabled_Description',
					enableQuery: {
						_id: 'Livechat_enabled',
						value: true,
					},
				});
				await this.add('VoIP_JWT_Secret', '', {
					type: 'password',
					i18nDescription: 'VoIP_JWT_Secret_description',
					enableQuery: {
						_id: 'VoIP_Enabled',
						value: true,
					},
				});
			});
			await this.section('Voip_Server_Configuration', async function () {
				await this.add('VoIP_Server_Name', '', {
					type: 'string',
					public: true,
					placeholder: 'WebSocket Server',
					enableQuery: {
						_id: 'VoIP_Enabled',
						value: true,
					},
				});
				await this.add('VoIP_Server_Websocket_Path', '', {
					type: 'string',
					public: true,
					placeholder: 'wss://your.domain.name',
					enableQuery: {
						_id: 'VoIP_Enabled',
						value: true,
					},
				});
				await this.add('VoIP_Retry_Count', -1, {
					type: 'int',
					public: true,
					i18nDescription: 'VoIP_Retry_Count_Description',
					placeholder: '1',
					enableQuery: {
						_id: 'VoIP_Enabled',
						value: true,
					},
				});
				await this.add('VoIP_Enable_Keep_Alive_For_Unstable_Networks', true, {
					type: 'boolean',
					public: true,
					i18nDescription: 'VoIP_Enable_Keep_Alive_For_Unstable_Networks_Description',
					enableQuery: {
						_id: 'Livechat_enabled',
						value: true,
					},
				});
			});

			await this.section('Management_Server', async function () {
				await this.add('VoIP_Management_Server_Host', '', {
					type: 'string',
					public: true,
					placeholder: 'https://your.domain.name',
					enableQuery: {
						_id: 'VoIP_Enabled',
						value: true,
					},
				});

				await this.add('VoIP_Management_Server_Port', 0, {
					type: 'int',
					public: true,
					placeholder: '8080',
					enableQuery: {
						_id: 'VoIP_Enabled',
						value: true,
					},
				});

				await this.add('VoIP_Management_Server_Name', '', {
					type: 'string',
					public: true,
					placeholder: 'Server Name',
					enableQuery: {
						_id: 'VoIP_Enabled',
						value: true,
					},
				});

				await this.add('VoIP_Management_Server_Username', '', {
					type: 'string',
					public: true,
					placeholder: 'Username',
					enableQuery: {
						_id: 'VoIP_Enabled',
						value: true,
					},
				});

				await this.add('VoIP_Management_Server_Password', '', {
					type: 'password',
					secret: true,
					enableQuery: {
						_id: 'VoIP_Enabled',
						value: true,
					},
				});
			});
		});
	});
