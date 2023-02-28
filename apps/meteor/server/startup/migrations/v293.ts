import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';
import { Users } from '../../../app/models/server';

addMigration({
	version: 293,
	async up() {
		const useRealName = await Settings.findOneById('UI_Use_Real_Name');
		const hideUsernames = await Settings.findOneById('Accounts_Default_User_Preferences_hideUsernames');

		const getNewSettingValue = (hideUsernames: boolean): string => {
			if (useRealName?.value) {
				return hideUsernames ? 'full_name' : 'username_and_full_name';
			}
			return 'username';
		};

		const newValue = getNewSettingValue(!!hideUsernames?.value);
		await Settings.deleteMany({
			_id: {
				$in: ['Accounts_Default_User_Preferences_hideUsernames', 'UI_Use_Real_Name'],
			},
		});

		Settings.update(
			{
				_id: 'Accounts_Default_User_Preferences_messagesLayout',
			},
			{
				$set: {
					value: newValue,
				},
			},
			{
				upsert: true,
			},
		);

		Users.update(
			{ 'settings.preferences.hideUsernames': true },
			{
				$unset: {
					'settings.preferences.hideUsernames': 1,
				},
				$set: {
					'settings.preferences.messagesLayout': getNewSettingValue(true),
				},
			},
			{ multi: true },
		);

		Users.update(
			{ 'settings.preferences.hideUsernames': false },
			{
				$unset: {
					'settings.preferences.hideUsernames': 1,
				},
				$set: {
					'settings.preferences.messagesLayout': getNewSettingValue(false),
				},
			},
			{ multi: true },
		);
	},
});
