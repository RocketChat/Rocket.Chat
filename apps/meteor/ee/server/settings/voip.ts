import { settingsRegistry } from '../../../server/settings';

export function addSettings(): Promise<void> {
	return settingsRegistry.addGroup('VoIP_TeamCollab', async function () {
		await this.with(
			{
				enterprise: true,
				modules: ['teams-voip'],
			},
			async function () {
				await this.section('VoIP_TeamCollab_WebRTC', async function () {
					await this.add('VoIP_TeamCollab_Screen_Sharing_Enabled', true, {
						type: 'boolean',
						public: true,
						invalidValue: false,
						i18nDescription: 'VoIP_TeamCollab_Screen_Sharing_Enabled_Description',
					});

					await this.add('VoIP_TeamCollab_Mobile_Ringing_Enabled', false, {
						type: 'boolean',
						public: true,
						invalidValue: false,
						alert: 'VoIP_TeamCollab_Mobile_Ringing_Enabled_Alert',
						i18nDescription: 'VoIP_TeamCollab_Mobile_Ringing_Enabled_Description',
					});

					await this.add('VoIP_TeamCollab_Ice_Servers', 'stun:stun.l.google.com:19302', {
						type: 'string',
						public: true,
						invalidValue: '',
					});

					await this.add('VoIP_TeamCollab_Ice_Gathering_Timeout', 5000, {
						type: 'int',
						public: true,
						invalidValue: 5000,
					});
				});

				await this.section('VoIP_TeamCollab_SIP_Integration', async function () {
					await this.add('VoIP_TeamCollab_SIP_Integration_Enabled', false, {
						type: 'boolean',
						public: true,
						invalidValue: false,
					});

					await this.add('VoIP_TeamCollab_SIP_Integration_For_Internal_Calls', false, {
						type: 'boolean',
						public: true,
						invalidValue: false,
						alert: 'VoIP_TeamCollab_Internal_SIP_Beta_Alert',
					});

					await this.add('VoIP_TeamCollab_Drachtio_Host', '', {
						type: 'string',
						public: false,
						invalidValue: '',
					});

					await this.add('VoIP_TeamCollab_Drachtio_Port', 9022, {
						type: 'int',
						public: false,
						invalidValue: 9022,
					});

					await this.add('VoIP_TeamCollab_Drachtio_Password', '', {
						type: 'password',
						secret: true,
						invalidValue: '',
					});

					await this.add('VoIP_TeamCollab_SIP_Server_Host', '', {
						type: 'string',
						public: false,
						invalidValue: '',
					});

					await this.add('VoIP_TeamCollab_SIP_Server_Port', 5060, {
						type: 'int',
						public: false,
						invalidValue: 5060,
					});
				});

				await this.section('VoIP_TeamCollab_ExternalCallHistory', async function () {
					await this.add('VoIP_TeamCollab_ExternalCallHistory_Enabled', false, {
						type: 'boolean',
						public: true,
						invalidValue: false,
						i18nDescription: 'VoIP_TeamCollab_ExternalCallHistory_Enabled_Description',
					});

					const enableQuery = { _id: 'VoIP_TeamCollab_ExternalCallHistory_Enabled', value: true };

					await this.add('VoIP_TeamCollab_ExternalCallHistory_Host', '', {
						type: 'string',
						public: false,
						invalidValue: '',
						enableQuery,
					});

					await this.add('VoIP_TeamCollab_ExternalCallHistory_User', '', {
						type: 'string',
						public: false,
						invalidValue: '',
						enableQuery,
					});

					await this.add('VoIP_TeamCollab_ExternalCallHistory_Password', '', {
						type: 'password',
						public: false,
						secret: true,
						invalidValue: '',
						enableQuery,
					});

					await this.add('VoIP_TeamCollab_ExternalCallHistory_Timeout', 10000, {
						type: 'int',
						public: false,
						invalidValue: 10000,
						enableQuery,
						i18nDescription: 'VoIP_TeamCollab_ExternalCallHistory_Timeout_Description',
					});
				});

				await this.section('VoIP_TeamCollab_AdvancedFeatures', async function () {
					const enableQuery = { _id: 'Pexip_Integration_Enabled', value: true };

					await this.add('VoIP_TeamCollab_Video_Escalation_Enabled', false, {
						type: 'boolean',
						public: true,
						invalidValue: false,
						enableQuery,
						i18nDescription: 'VoIP_TeamCollab_Video_Escalation_Enabled_Description',
					});
				});
			},
		);
	});
}
