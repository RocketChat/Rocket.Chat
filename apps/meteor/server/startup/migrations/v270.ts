import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server/raw';

const getFlag = async (key: string): Promise<boolean> => Boolean((await Settings.findOneById(key))?.value);

addMigration({
	version: 270,
	async up() {
		let dmEnabled = true;
		let channelEnabled = true;
		let groupEnabled = true;
		let teamsEnabled = true;

		if (await getFlag('bigbluebutton_Enabled')) {
			dmEnabled = await getFlag('bigbluebutton_enable_d');
			channelEnabled = await getFlag('bigbluebutton_enable_c');
			groupEnabled = await getFlag('bigbluebutton_enable_p');
			teamsEnabled = await getFlag('bigbluebutton_enable_teams');
		} else if (await getFlag('Jitsi_Enabled')) {
			channelEnabled = await getFlag('Jitsi_Enable_Channels');
			groupEnabled = channelEnabled;
			teamsEnabled = await getFlag('Jitsi_Enable_Teams');
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
					'Video Conference',
					'Jitsi',
					'BigBlueButton',
				],
			},
		});
	},
});
