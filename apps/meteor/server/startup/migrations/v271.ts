import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server/raw';

addMigration({
	version: 271,
	async up() {
		await Settings.deleteMany({
			_id: {
				$in: [
					'VideoConf_Enabled',
					'VideoConf_Enable_DMs',
					'VideoConf_Enable_Teams',
					'VideoConf_Enable_Groups',
					'VideoConf_Enable_Channels',
				],
			},
		});
	},
});
