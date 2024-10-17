import type { ISetting } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';
import { isValidCron } from 'cron-validator';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 308,
	name: 'Update packageValue from LDAP interval settings',
	async up() {
		const newAvatarSyncPackageValue = '0 0 * * *';
		const newAutoLogoutPackageValue = '*/5 * * * *';
		const ldapAvatarSyncInterval = await Settings.findOneById<Pick<ISetting, 'value'>>('LDAP_Background_Sync_Avatars_Interval', {
			projection: { value: 1 },
		});
		const ldapAutoLogoutInterval = await Settings.findOneById<Pick<ISetting, 'value'>>('LDAP_Sync_AutoLogout_Interval', {
			projection: { value: 1 },
		});
		const isValidAvatarSyncInterval = ldapAvatarSyncInterval && isValidCron(ldapAvatarSyncInterval.value as string);
		const isValidAutoLogoutInterval = ldapAutoLogoutInterval && isValidCron(ldapAutoLogoutInterval.value as string);

		await Settings.updateOne(
			{ _id: 'LDAP_Background_Sync_Avatars_Interval' },
			{ $set: { packageValue: newAvatarSyncPackageValue, ...(!isValidAvatarSyncInterval && { value: newAvatarSyncPackageValue }) } },
		);
		await Settings.updateOne(
			{ _id: 'LDAP_Sync_AutoLogout_Interval' },
			{ $set: { packageValue: newAutoLogoutPackageValue, ...(!isValidAutoLogoutInterval && { value: newAutoLogoutPackageValue }) } },
		);
	},
});
