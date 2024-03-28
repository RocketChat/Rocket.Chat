import type { IImportUser, ILDAPEntry, IUser } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../app/settings/server';
import { callbacks } from '../../../lib/callbacks';
import type { LDAPConnection } from '../../../server/lib/ldap/Connection';
import { logger } from '../../../server/lib/ldap/Logger';
import { LDAPEEManager } from '../lib/ldap/Manager';
import { LDAPEE } from '../sdk';
import { addSettings, ldapIntervalValuesToCronMap } from '../settings/ldap';

Meteor.startup(async () => {
	await License.onLicense('ldap-enterprise', async () => {
		await addSettings();

		// Configure background sync cronjob
		function configureBackgroundSync(jobName: string, enableSetting: string, intervalSetting: string, cb: () => void): () => Promise<void> {
			let lastSchedule: string;
			return async function addCronJobDebounced(): Promise<void> {
				if (settings.get('LDAP_Enable') !== true || settings.get(enableSetting) !== true) {
					if (await cronJobs.has(jobName)) {
						logger.info({ msg: 'Disabling LDAP Background Sync', jobName });
						await cronJobs.remove(jobName);
					}
					return;
				}

				const settingValue = settings.get<string>(intervalSetting);
				const schedule = ldapIntervalValuesToCronMap[settingValue] ?? settingValue;
				if (schedule) {
					if (schedule !== lastSchedule && (await cronJobs.has(jobName))) {
						await cronJobs.remove(jobName);
					}

					lastSchedule = schedule;
					logger.info({ msg: 'Enabling LDAP Background Sync', jobName });

					await cronJobs.add(jobName, schedule, cb);
				}
			};
		}

		const addCronJob = configureBackgroundSync('LDAP_Sync', 'LDAP_Background_Sync', 'LDAP_Background_Sync_Interval', () => LDAPEE.sync());
		const addAvatarCronJob = configureBackgroundSync(
			'LDAP_AvatarSync',
			'LDAP_Background_Sync_Avatars',
			'LDAP_Background_Sync_Avatars_Interval',
			() => LDAPEE.syncAvatars(),
		);
		const addLogoutCronJob = configureBackgroundSync(
			'LDAP_AutoLogout',
			'LDAP_Sync_AutoLogout_Enabled',
			'LDAP_Sync_AutoLogout_Interval',
			() => LDAPEE.syncLogout(),
		);

		settings.watchMultiple(['LDAP_Background_Sync', 'LDAP_Background_Sync_Interval'], addCronJob);
		settings.watchMultiple(['LDAP_Background_Sync_Avatars', 'LDAP_Background_Sync_Avatars_Interval'], addAvatarCronJob);
		settings.watchMultiple(['LDAP_Sync_AutoLogout_Enabled', 'LDAP_Sync_AutoLogout_Interval'], addLogoutCronJob);

		settings.watch('LDAP_Enable', async () => {
			await addCronJob();
			await addAvatarCronJob();
			await addLogoutCronJob();
		});

		settings.watch<string>('LDAP_Groups_To_Rocket_Chat_Teams', (value) => {
			try {
				LDAPEEManager.validateLDAPTeamsMappingChanges(value);
			} catch (error) {
				logger.error(error);
			}
		});

		callbacks.add(
			'mapLDAPUserData',
			(userData: IImportUser, ldapUser?: ILDAPEntry) => {
				if (!ldapUser) {
					return;
				}

				LDAPEEManager.copyCustomFields(ldapUser, userData);
				LDAPEEManager.copyActiveState(ldapUser, userData);
			},
			callbacks.priority.MEDIUM,
			'mapLDAPCustomFields',
		);

		callbacks.add(
			'onLDAPLogin',
			async ({ user, ldapUser, isNewUser }: { user: IUser; ldapUser: ILDAPEntry; isNewUser: boolean }, ldap?: LDAPConnection) => {
				if (!ldap) {
					return;
				}

				await LDAPEEManager.advancedSyncForUser(ldap, user, isNewUser, ldapUser.dn);
			},
			callbacks.priority.MEDIUM,
			'advancedLDAPSync',
		);
	});
});
