import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

type OldSettingValueRoomPick = {
	_id: string;
	name: string;
}[];

addMigration({
	version: 293,
	name: 'Update SlackBridge_Out_Channels value to new format',
	async up() {
		const oldSetting = await Settings.findOne({ _id: 'SlackBridge_Out_Channels' });
		if (!oldSetting?.value) {
			return;
		}

		const newSettingValue = (oldSetting.value as OldSettingValueRoomPick)?.map((room) => room._id);

		await Settings.updateOne(
			{
				_id: 'SlackBridge_Out_Channels',
			},
			{
				$set: {
					value: newSettingValue,
				},
			},
		);
	},
});
