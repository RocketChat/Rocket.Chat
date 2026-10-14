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

					await this.add('VoIP_TeamCollab_TURN_Auth_Mode', 'static', {
						type: 'select',
						values: [
							{ key: 'static', i18nLabel: 'VoIP_TeamCollab_TURN_Auth_Mode_Static' },
							{ key: 'shared-secret', i18nLabel: 'VoIP_TeamCollab_TURN_Auth_Mode_Shared_Secret' },
						],
						public: false,
						invalidValue: 'static',
					});

					const sharedSecretMode = { _id: 'VoIP_TeamCollab_TURN_Auth_Mode', value: 'shared-secret' };

					await this.add('VoIP_TeamCollab_TURN_Servers', '', {
						type: 'string',
						public: false,
						invalidValue: '',
						enableQuery: sharedSecretMode,
					});

					await this.add('VoIP_TeamCollab_TURN_Shared_Secret', '', {
						type: 'password',
						secret: true,
						invalidValue: '',
						enableQuery: sharedSecretMode,
					});

					await this.add('VoIP_TeamCollab_TURN_Credential_TTL', 86400, {
						type: 'int',
						public: false,
						invalidValue: 86400,
						enableQuery: sharedSecretMode,
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
			},
		);
	});
}
