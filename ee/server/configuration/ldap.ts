import { Meteor } from 'meteor/meteor';
import { Promise } from 'meteor/promise';
import _ from 'underscore';

import { LDAPEE } from '../sdk';
import { settings } from '../../../app/settings/server';
import { logger } from '../../../server/lib/ldap/Logger';
import { cronJobs } from '../../../app/utils/server/lib/cron/Cronjobs';
import { LDAPEEManager } from '../lib/ldap/Manager';
import { callbacks } from '../../../app/callbacks/server';
import type { IImportUser } from '../../../definition/IImportUser';
import type { ILDAPEntry } from '../../../definition/ldap/ILDAPEntry';
import type { SettingCallback } from '../../../app/settings/lib/settings';
import { onLicense } from '../../app/license/server';

onLicense('ldap-enterprise', () => {
	// Configure background sync cronjob
	function configureBackgroundSync(jobName: string, enableSetting: string, intervalSetting: string, cb: () => {}): SettingCallback {
		let lastSchedule: string;

		return _.debounce(Meteor.bindEnvironment(function addCronJobDebounced() {
			if (settings.get(enableSetting) !== true) {
				logger.info({ msg: 'Disabling LDAP Background Sync', jobName });
				if (cronJobs.nextScheduledAtDate(jobName)) {
					cronJobs.remove(jobName);
				}
				return;
			}

			const schedule = settings.get<string>(intervalSetting);
			if (schedule) {
				if (schedule !== lastSchedule && cronJobs.nextScheduledAtDate(jobName)) {
					cronJobs.remove(jobName);
				}

				lastSchedule = schedule;
				logger.info({ msg: 'Enabling LDAP Background Sync', jobName });
				cronJobs.add(jobName, schedule, () => cb(), 'text');
			}
		}), 500);
	}

	const addCronJob = configureBackgroundSync('LDAP_Sync', 'LDAP_Background_Sync', 'LDAP_Background_Sync_Interval', () => Promise.await(LDAPEE.sync()));
	const addAvatarCronJob = configureBackgroundSync('LDAP_AvatarSync', 'LDAP_Background_Sync_Avatars', 'LDAP_Background_Sync_Avatars_Interval', () => Promise.await(LDAPEE.syncAvatars()));

	Meteor.defer(() => {
		settings.get('LDAP_Background_Sync', addCronJob);
		settings.get('LDAP_Background_Sync_Interval', addCronJob);
		settings.get('LDAP_Background_Sync_Avatars', addAvatarCronJob);
		settings.get('LDAP_Background_Sync_Avatars_Interval', addAvatarCronJob);

		settings.get('LDAP_Groups_To_Rocket_Chat_Teams', (_key, value) => {
			try {
				LDAPEEManager.validateLDAPTeamsMappingChanges(value as string);
			} catch (error) {
				logger.error(error);
			}
		});
	});

	callbacks.add('mapLDAPUserData', (userData: IImportUser, ldapUser: ILDAPEntry) => {
		LDAPEEManager.copyCustomFields(ldapUser, userData);
		LDAPEEManager.copyActiveState(ldapUser, userData);
	}, callbacks.priority.MEDIUM, 'mapLDAPCustomFields');
});
