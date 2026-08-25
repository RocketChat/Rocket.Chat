import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 341,
	name: 'Remove deprecated legacy federation and Matrix bridge settings',
	async up() {
		await Settings.deleteMany({
			_id: {
				$in: [
					'FEDERATION_Enabled',
					'FEDERATION_Status',
					'FEDERATION_Domain',
					'FEDERATION_Public_Key',
					'FEDERATION_Discovery_Method',
					'FEDERATION_Test_Setup',
					'Federation_Matrix_enabled',
					'Federation_Matrix_serve_well_known',
					'Federation_Matrix_enable_ephemeral_events',
					'Federation_Matrix_id',
					'Federation_Matrix_hs_token',
					'Federation_Matrix_as_token',
					'Federation_Matrix_homeserver_url',
					'Federation_Matrix_homeserver_domain',
					'Federation_Matrix_bridge_url',
					'Federation_Matrix_bridge_localpart',
					'Federation_Matrix_registration_file',
					'Federation_Matrix_max_size_of_public_rooms_users',
					'Federation_Matrix_configuration_status',
					'Federation_Matrix_check_configuration_button',
				],
			},
		});
	},
});
