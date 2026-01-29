import { settingsRegistry } from '../../../app/settings/server';

export function addSettings(): Promise<void> {
	return settingsRegistry.addGroup('VoIP_TeamCollab', async function () {
		await this.with(
			{
				enterprise: true,
				modules: ['teams-voip'],
			},
			async function () {
				await this.section('VoIP_TeamCollab_WebRTC', async function () {
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
			},
		);
	});
}
