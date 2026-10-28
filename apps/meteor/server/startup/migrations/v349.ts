import type { ISetting } from '@rocket.chat/core-typings';
import { Settings, Users } from '@rocket.chat/models';
import type { UpdateFilter } from 'mongodb';

import { addMigration } from '../../lib/migrations';
import { settings } from '../../settings';

addMigration({
	version: 349,
	name: 'Remove the stale Drafts sidebar group from the default sections order and from user sidebar categories',
	async up() {
		await Settings.updateOne({ _id: 'Accounts_Default_User_Preferences_sidebarSectionsOrder', value: { $type: 'array' } }, {
			$pull: { value: 'Drafts' },
		} as unknown as UpdateFilter<ISetting>);

		const sectionsOrder = await Settings.findOneById('Accounts_Default_User_Preferences_sidebarSectionsOrder');
		if (sectionsOrder) {
			settings.set(sectionsOrder);
		}

		await Users.updateMany(
			{ 'settings.preferences.sidebarCategories': { $elemMatch: { _id: 'Drafts', default: true } } },
			{ $pull: { 'settings.preferences.sidebarCategories': { _id: 'Drafts', default: true } } },
		);
	},
});
