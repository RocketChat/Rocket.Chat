import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';
import { settings } from '../../../app/settings/server';

addMigration({
	version: 293,
	name: 'Change old "LDAP_Background_Sync_Interval" and "CROWD_Sync_Interval" to a pre-defined values instead of accept any input from the user',
	async up() {
		const ldapDefaultValue = 'every_24_hours';
		const crowdDefaultValue = 'every_1_hours';
		const ldapSyncInterval = settings.get<string>('LDAP_Background_Sync_Interval');
		const crowdSyncInterval = settings.get<string>('CROWD_Sync_Interval');

		if (ldapSyncInterval !== ldapDefaultValue) {
			await Settings.updateOne(
				{
					_id: 'LDAP_Background_Sync_Interval',
				},
				{
					$set: {
						value: ldapDefaultValue,
					},
				},
			);
			console.warn(
				`The default value for the LDAP background synchronization interval has changed from "${ldapSyncInterval}" to "${ldapDefaultValue}". Please review your settings.`,
			);
		}
		if (crowdSyncInterval !== crowdDefaultValue) {
			await Settings.updateOne(
				{
					_id: 'CROWD_Sync_Interval',
				},
				{
					$set: {
						value: crowdDefaultValue,
					},
				},
			);
			console.warn(
				`The default value for the CROWD background synchronization interval has changed from "${crowdSyncInterval}" to "${crowdDefaultValue}". Please review your settings.`,
			);
		}
	},
});
