import { settingsRegistry } from '../../app/settings/server';

const pushEnabledWithoutGateway = [
	{
		_id: 'Push_enable',
		value: true,
	},
	{
		_id: 'Push_enable_gateway',
		value: false,
	},
];

export const createPushSettings = () =>
	settingsRegistry.addGroup('Push', async function () {
		await this.add('Push_enable', true, {
			type: 'boolean',
			public: true,
			alert: 'Push_Setting_Requires_Restart_Alert',
		});

		// TODO: Push_UseLegacy should be removed in 8.0.0, as well as Push_gcm_project_number and Push_gcm_api_key
		await this.add('Push_UseLegacy', false, {
			type: 'boolean',
			hidden: true,
			alert: 'Push_Setting_Legacy_Warning',
		});

		await this.add('Push_enable_gateway', true, {
			type: 'boolean',
			alert: 'Push_Setting_Requires_Restart_Alert',
			enableQuery: [
				{
					_id: 'Push_enable',
					value: true,
				},
				{
					_id: 'Register_Server',
					value: true,
				},
				{
					_id: 'Cloud_Service_Agree_PrivacyTerms',
					value: true,
				},
			],
		});
		await this.add('Push_gateway', 'https://gateway.rocket.chat', {
			type: 'string',
			i18nDescription: 'Push_gateway_description',
			alert: 'Push_Setting_Requires_Restart_Alert',
			multiline: true,
			enableQuery: [
				{
					_id: 'Push_enable',
					value: true,
				},
				{
					_id: 'Push_enable_gateway',
					value: true,
				},
			],
		});
		await this.add('Push_production', true, {
			type: 'boolean',
			public: true,
			alert: 'Push_Setting_Requires_Restart_Alert',
			enableQuery: pushEnabledWithoutGateway,
		});
		await this.add('Push_test_push', 'push_test', {
			type: 'action',
			actionText: 'Send_a_test_push_to_my_user',
			enableQuery: {
				_id: 'Push_enable',
				value: true,
			},
		});
		await this.section('Certificates_and_Keys', async function () {
			await this.add('Push_apn_passphrase', '', {
				type: 'string',
				enableQuery: [],
				secret: true,
			});
			await this.add('Push_apn_key', '', {
				type: 'string',
				multiline: true,
				enableQuery: [],
				secret: true,
			});
			await this.add('Push_apn_cert', '', {
				type: 'string',
				multiline: true,
				enableQuery: [],
				secret: true,
			});
			await this.add('Push_apn_dev_passphrase', '', {
				type: 'string',
				enableQuery: [],
				secret: true,
			});
			await this.add('Push_apn_dev_key', '', {
				type: 'string',
				multiline: true,
				enableQuery: [],
				secret: true,
			});
			await this.add('Push_apn_dev_cert', '', {
				type: 'string',
				multiline: true,
				enableQuery: [],
				secret: true,
			});
			await this.add('Push_gcm_api_key', '', {
				type: 'string',
				hidden: true,
				enableQuery: [
					{
						_id: 'Push_UseLegacy',
						value: true,
					},
				],
				secret: true,
			});

			await this.add('Push_google_api_credentials', '', {
				type: 'code',
				multiline: true,
				enableQuery: [
					{
						_id: 'Push_UseLegacy',
						value: false,
					},
				],
				secret: true,
			});

			return this.add('Push_gcm_project_number', '', {
				type: 'string',
				hidden: true,
				enableQuery: [
					{
						_id: 'Push_UseLegacy',
						value: true,
					},
				],
				secret: true,
			});
		});
		return this.section('Privacy', async function () {
			await this.add('Push_show_username_room', true, {
				type: 'boolean',
				public: true,
			});
			await this.add('Push_show_message', true, {
				type: 'boolean',
				public: true,
			});
			await this.add('Push_request_content_from_server', true, {
				type: 'boolean',
				enterprise: true,
				invalidValue: false,
				modules: ['push-privacy'],
			});
		});
	});
