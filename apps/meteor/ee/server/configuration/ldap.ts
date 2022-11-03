import { Meteor } from 'meteor/meteor';
import type { IImportUser, ILDAPEntry, IUser } from '@rocket.chat/core-typings';

import { LDAPEE } from '../sdk';
import { settings } from '../../../app/settings/server';
import type { LDAPConnection } from '../../../server/lib/ldap/Connection';
import { logger } from '../../../server/lib/ldap/Logger';
import { cronJobs } from '../../../app/utils/server/lib/cron/Cronjobs';
import { LDAPEEManager } from '../lib/ldap/Manager';
import { callbacks } from '../../../lib/callbacks';
import { onLicense } from '../../app/license/server';
import { addSettings } from '../settings/ldap';

Meteor.startup(() =>
	onLicense('ldap-enterprise', () => {
		addSettings();

		// Configure background sync cronjob
		function configureBackgroundSync(jobName: string, enableSetting: string, intervalSetting: string, cb: () => void): () => void {
			let lastSchedule: string;
			return function addCronJobDebounced(): void {
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

		settings.watch('LDAP_Enable', () => {
			addCronJob();
			addAvatarCronJob();
			addLogoutCronJob();
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
			({ user, ldapUser, isNewUser }: { user: IUser; ldapUser: ILDAPEntry; isNewUser: boolean }, ldap?: LDAPConnection) => {
				if (!ldap) {
					return;
				}

				Promise.await(LDAPEEManager.advancedSyncForUser(ldap, user, isNewUser, ldapUser.dn));
			},
			callbacks.priority.MEDIUM,
			'advancedLDAPSync',
		);
	}),
);
