import { Settings, Permissions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 325,
	name: 'Remove VoIP_Omnichannel Settings and Permissions',
	async up() {
		await Settings.deleteMany({
			_id: {
				$in: [
					'VoIP_Omnichannel',
					'VoIP_Enabled',
					'VoIP_JWT_Secret',
					'Voip_Server_Configuration',
					'VoIP_Server_Name',
					'VoIP_Server_Websocket_Path',
					'VoIP_Retry_Count',
					'VoIP_Enable_Keep_Alive_For_Unstable_Networks',
					'VoIP_Management_Server_Host',
					'VoIP_Management_Server_Port',
					'VoIP_Management_Server_Name',
					'VoIP_Management_Server_Username',
					'VoIP_Management_Server_Password',
				],
			},
		});

		await Permissions.deleteMany({
			_id: {
				$in: [
					'manage-voip-call-settings',
					'manage-voip-contact-center-settings',
					'manage-agent-extension-association',
					'inbound-voip-calls',
					'spy-voip-calls',
					'outbound-voip-calls',
					'view-agent-extension-association',
				],
			},
		});
	},
});
