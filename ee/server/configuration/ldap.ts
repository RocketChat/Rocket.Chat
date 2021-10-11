import { Meteor } from 'meteor/meteor';
import { Promise } from 'meteor/promise';
import _ from 'underscore';

import { LDAPEE } from '../sdk';
import { settings } from '../../../app/settings/server';
import { LDAPConnection } from '../../../server/lib/ldap/Connection';
import { logger } from '../../../server/lib/ldap/Logger';
import { cronJobs } from '../../../app/utils/server/lib/cron/Cronjobs';
import { LDAPEEManager } from '../lib/ldap/Manager';
import { callbacks } from '../../../lib/callbacks';
import type { IImportUser } from '../../../definition/IImportUser';
import type { ILDAPEntry } from '../../../definition/ldap/ILDAPEntry';
import type { SettingValue } from '../../../definition/ISetting';
import type { IUser } from '../../../definition/IUser';
import type { SettingCallback } from '../../../app/settings/lib/settings';
import { onLicense } from '../../app/license/server';
import { addSettings } from '../settings/ldap';

Meteor.startup(() => onLicense('ldap-enterprise', () => {
	addSettings();

	// Configure background sync cronjob
	function configureBackgroundSync(jobName: string, enableSetting: string, intervalSetting: string, cb: () => {}): SettingCallback {
		let lastSchedule: string;

		return _.debounce(Meteor.bindEnvironment(function addCronJobDebounced() {
			if (settings.get('LDAP_Enable') !== true || settings.get(enableSetting) !== true) {
				if (cronJobs.nextScheduledAtDate(jobName)) {
					logger.info({ msg: 'Disabling LDAP Background Sync', jobName });
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
	const addLogoutCronJob = configureBackgroundSync('LDAP_AutoLogout', 'LDAP_Sync_AutoLogout_Enabled', 'LDAP_Sync_AutoLogout_Interval', () => Promise.await(LDAPEE.syncLogout()));

	Meteor.defer(() => {
		settings.get('LDAP_Background_Sync', addCronJob);
		settings.get('LDAP_Background_Sync_Interval', addCronJob);
		settings.get('LDAP_Background_Sync_Avatars', addAvatarCronJob);
		settings.get('LDAP_Background_Sync_Avatars_Interval', addAvatarCronJob);
		settings.get('LDAP_Sync_AutoLogout_Enabled', addLogoutCronJob);
		settings.get('LDAP_Sync_AutoLogout_Interval', addLogoutCronJob);

		settings.get('LDAP_Enable', (key: string, value: SettingValue, initialLoad?: boolean) => {
			addCronJob(key, value, initialLoad);
			addAvatarCronJob(key, value, initialLoad);
			addLogoutCronJob(key, value, initialLoad);
		});

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

	callbacks.add('onLDAPLogin', ({ user, ldapUser, isNewUser }: { user: IUser; ldapUser: ILDAPEntry; isNewUser: boolean }, ldap: LDAPConnection) => {
		Promise.await(LDAPEEManager.advancedSyncForUser(ldap, user, isNewUser, ldapUser.dn));
	}, callbacks.priority.MEDIUM, 'advancedLDAPSync');
}));
