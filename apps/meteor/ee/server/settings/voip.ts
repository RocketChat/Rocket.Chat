import { settingsRegistry } from '../../../app/settings/server';

export function addSettings(): Promise<void> {
	return settingsRegistry.addGroup('VoIP_TeamCollab', async function () {
		await this.with(
			{
				enterprise: true,
				modules: ['teams-voip'],
			},
			async function () {
				const enableQuery = { _id: 'VoIP_TeamCollab_Enabled', value: true };

				await this.add('VoIP_TeamCollab_Enabled', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
					alert: 'VoIP_TeamCollab_Beta_Alert',
				});

				await this.add('VoIP_TeamCollab_FreeSwitch_Host', '', {
					type: 'string',
					public: true,
					invalidValue: '',
					enableQuery,
				});

				await this.add('VoIP_TeamCollab_FreeSwitch_Port', 8021, {
					type: 'int',
					public: true,
					invalidValue: 8021,
					enableQuery,
				});

				await this.add('VoIP_TeamCollab_FreeSwitch_Password', '', {
					type: 'password',
					secret: true,
					invalidValue: '',
					enableQuery,
				});

				await this.add('VoIP_TeamCollab_FreeSwitch_Timeout', 3000, {
					type: 'int',
					public: true,
					invalidValue: 3000,
					enableQuery,
				});

				await this.add('VoIP_TeamCollab_FreeSwitch_WebSocket_Path', '', {
					type: 'string',
					public: true,
					invalidValue: '',
					enableQuery,
				});

				await this.add('VoIP_TeamCollab_Ice_Servers', 'stun:stun.l.google.com:19302', {
					type: 'string',
					public: true,
					invalidValue: '',
					enableQuery,
				});

				await this.add('VoIP_TeamCollab_Ice_Gathering_Timeout', 5000, {
					type: 'int',
					public: true,
					invalidValue: 5000,
					enableQuery,
				});
			},
		);
	});
}
