import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 275,
	async up() {
		await Settings.deleteMany({
			_id: {
				$in: [
					'bigbluebutton_Enabled',
					'bigbluebutton_server',
					'bigbluebutton_sharedSecret',
					'bigbluebutton_Open_New_Window',
					'bigbluebutton_enable_d',
					'bigbluebutton_enable_p',
					'bigbluebutton_enable_c',
					'bigbluebutton_enable_teams',
					'Jitsi_Enabled',
					'Jitsi_Domain',
					'Jitsi_URL_Room_Prefix',
					'Jitsi_URL_Room_Suffix',
					'Jitsi_URL_Room_Hash',
					'Jitsi_SSL',
					'Jitsi_Open_New_Window',
					'Jitsi_Enable_Channels',
					'Jitsi_Enable_Teams',
					'Jitsi_Chrome_Extension',
					'Jitsi_Enabled_TokenAuth',
					'Jitsi_Application_ID',
					'Jitsi_Application_Secret',
					'Jitsi_Limit_Token_To_Room',
					'Video Conference',
					'Jitsi',
					'BigBlueButton',
				],
			},
		});
	},
});
