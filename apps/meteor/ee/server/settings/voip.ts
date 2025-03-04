import { settingsRegistry } from '../../../app/settings/server';

export function addSettings(): Promise<void> {
	return settingsRegistry.addGroup('VoIP_TeamCollab', async function () {
		await this.with(
			{
				enterprise: true,
				modules: ['teams-voip'],
			},
			async function () {
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
				});

				await this.add('VoIP_TeamCollab_FreeSwitch_Port', 8021, {
					type: 'int',
					public: true,
					invalidValue: 8021,
				});

				await this.add('VoIP_TeamCollab_FreeSwitch_Password', '', {
					type: 'password',
					secret: true,
					invalidValue: '',
				});

				await this.add('VoIP_TeamCollab_FreeSwitch_Timeout', 3000, {
					type: 'int',
					public: true,
					invalidValue: 3000,
				});

				await this.add('VoIP_TeamCollab_FreeSwitch_WebSocket_Path', '', {
					type: 'string',
					public: true,
					invalidValue: '',
				});
			},
		);
	});
}
