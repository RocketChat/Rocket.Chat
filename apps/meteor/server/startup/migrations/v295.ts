import type { ISetting } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

import { SystemLogger } from '../../lib/logger/system';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 295,
	name: 'Change old "LDAP_Background_Sync_Interval" and "CROWD_Sync_Interval" to a pre-defined values instead of accept any input from the user',
	async up() {
		const oldLdapDefault = 'Every 24 hours';
		const oldCrowdDefault = 'Every 60 mins';

		const newLdapDefault = 'every_24_hours';
		const newCrowdDefault = 'every_1_hours';

		const ldapSyncInterval = await Settings.findOneById<Pick<ISetting, 'value'>>('LDAP_Background_Sync_Interval', {
			projection: { value: 1 },
		});
		const crowdSyncInterval = await Settings.findOneById<Pick<ISetting, 'value'>>('CROWD_Sync_Interval', { projection: { value: 1 } });

		// update setting values
		await Settings.updateOne({ _id: 'LDAP_Background_Sync_Interval' }, { $set: { value: newLdapDefault } });
		await Settings.updateOne({ _id: 'CROWD_Sync_Interval' }, { $set: { value: newCrowdDefault } });

		// notify user about the changes if the value was different from the default

		if (ldapSyncInterval && ldapSyncInterval.value !== oldLdapDefault) {
			SystemLogger.warn(
				`The value of the setting 'LDAP background synchronization interval' has changed from "${ldapSyncInterval.value}" to "${newLdapDefault}". Please review your settings.`,
			);
		}

		if (crowdSyncInterval && crowdSyncInterval.value !== oldCrowdDefault) {
			SystemLogger.warn(
				`The value of the setting 'CROWD background synchronization interval' has changed from "${crowdSyncInterval.value}" to "${newCrowdDefault}". Please review your settings.`,
			);
		}
	},
});
