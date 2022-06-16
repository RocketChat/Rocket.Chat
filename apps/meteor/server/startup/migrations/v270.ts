import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server/raw';

const getFlag = async (key: string): Promise<boolean> => Boolean((await Settings.findOneById(key))?.value);

addMigration({
	version: 270,
	async up() {
		let dmEnabled: boolean;
		let channelEnabled: boolean;
		let groupEnabled: boolean;
		let teamsEnabled: boolean;

		const bbbEnabled = await getFlag('bigbluebutton_Enabled');
		const jitsiEnabled = await getFlag('Jitsi_Enabled');

		// If only one provider was enabled, load the settings from it
		if (bbbEnabled !== jitsiEnabled) {
			if (bbbEnabled) {
				dmEnabled = await getFlag('bigbluebutton_enable_d');
				channelEnabled = await getFlag('bigbluebutton_enable_c');
				groupEnabled = await getFlag('bigbluebutton_enable_p');
				teamsEnabled = await getFlag('bigbluebutton_enable_teams');
			} else {
				dmEnabled = true;
				channelEnabled = await getFlag('Jitsi_Enable_Channels');
				groupEnabled = channelEnabled;
				teamsEnabled = await getFlag('Jitsi_Enable_Teams');
			}
		} else {
			dmEnabled = await getFlag('bigbluebutton_enable_d');

			channelEnabled = (await getFlag('Jitsi_Enable_Channels')) || (await getFlag('bigbluebutton_enable_c'));
			groupEnabled = (await getFlag('Jitsi_Enable_Channels')) || (await getFlag('bigbluebutton_enable_p'));
			teamsEnabled = (await getFlag('Jitsi_Enable_Teams')) || (await getFlag('bigbluebutton_enable_teams'));
		}

		Settings.updateValueById('VideoConf_Enable_DMs', dmEnabled);
		Settings.updateValueById('VideoConf_Enable_Channels', channelEnabled);
		Settings.updateValueById('VideoConf_Enable_Groups', groupEnabled);
		Settings.updateValueById('VideoConf_Enable_Teams', teamsEnabled);

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
					'Jitsi_Click_To_Join_Count',
					'Jitsi_Start_SlashCommands_Count',
					'Video Conference',
					'Jitsi',
					'BigBlueButton',
				],
			},
		});
	},
});
