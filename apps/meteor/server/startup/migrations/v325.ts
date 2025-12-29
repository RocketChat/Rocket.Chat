import type { IPermission } from '@rocket.chat/core-typings';
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
					'manage-voip-call-settings' as IPermission['_id'],
					'manage-voip-contact-center-settings' as IPermission['_id'],
					'manage-agent-extension-association' as IPermission['_id'],
					'inbound-voip-calls' as IPermission['_id'],
					'spy-voip-calls' as IPermission['_id'],
					'outbound-voip-calls' as IPermission['_id'],
					'view-agent-extension-association' as IPermission['_id'],
				],
			},
		});
	},
});
