import type { ISetting } from '@rocket.chat/core-typings';
import { Settings, Users } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 349,
	name: 'Remove the stale Drafts sidebar group from the default sections order and from user sidebar categories',
	async up() {
		const setting = await Settings.findOneById<Pick<ISetting, 'value'>>('Accounts_Default_User_Preferences_sidebarSectionsOrder', {
			projection: { value: 1 },
		});
		const sectionsOrder = Array.isArray(setting?.value) ? (setting.value as string[]) : [];

		if (sectionsOrder.includes('Drafts')) {
			await Settings.updateOne(
				{ _id: 'Accounts_Default_User_Preferences_sidebarSectionsOrder' },
				{ $set: { value: sectionsOrder.filter((key) => key !== 'Drafts') } },
			);
		}

		await Users.updateMany(
			{ 'settings.preferences.sidebarCategories': { $elemMatch: { _id: 'Drafts', default: true } } },
			{ $pull: { 'settings.preferences.sidebarCategories': { _id: 'Drafts', default: true } } },
		);
	},
});
