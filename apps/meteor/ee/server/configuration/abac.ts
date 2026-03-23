import { Abac } from '@rocket.chat/core-services';
import { cronJobs } from '@rocket.chat/cron';
import { License } from '@rocket.chat/license';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../app/settings/server';
import { LDAPEE } from '../sdk';

const EXTERNAL_PDP_SYNC_JOB = 'ABAC_External_PDP_Sync';

const intervalToCronMap: Record<string, string> = {
	every_1_hour: '0 * * * *',
	every_6_hours: '0 */6 * * *',
	every_12_hours: '0 */12 * * *',
	every_24_hours: '0 0 * * *',
};

Meteor.startup(async () => {
	let stopWatcher: () => void;
	let stopCronWatcher: () => void;

	License.onToggledFeature('abac', {
		up: async () => {
			const { addSettings } = await import('../settings/abac');
			const { createPermissions } = await import('../lib/abac');

			await addSettings();
			await createPermissions();

			await import('../hooks/abac');

			stopWatcher = settings.watch('ABAC_Enabled', async (value) => {
				if (value) {
					await LDAPEE.syncUsersAbacAttributes(Users.findLDAPUsers());
				}
			});

			// External PDP sync cron
			let lastSchedule: string;
			async function configureExternalPdpSync(): Promise<void> {
				const abacEnabled = settings.get('ABAC_Enabled');
				const pdpType = settings.get<string>('ABAC_PDP_Type');

				if (!abacEnabled || pdpType !== 'virtru') {
					if (await cronJobs.has(EXTERNAL_PDP_SYNC_JOB)) {
						await cronJobs.remove(EXTERNAL_PDP_SYNC_JOB);
					}
					return;
				}

				const intervalValue = settings.get<string>('ABAC_Virtru_Sync_Interval') || 'every_24_hours';
				const schedule = intervalToCronMap[intervalValue] ?? intervalToCronMap.every_24_hours;

				if (schedule !== lastSchedule && (await cronJobs.has(EXTERNAL_PDP_SYNC_JOB))) {
					await cronJobs.remove(EXTERNAL_PDP_SYNC_JOB);
				}

				lastSchedule = schedule;
				await cronJobs.add(EXTERNAL_PDP_SYNC_JOB, schedule, () => Abac.syncExternalPdpRooms());
			}

			stopCronWatcher = settings.watchMultiple(
				['ABAC_Enabled', 'ABAC_PDP_Type', 'ABAC_Virtru_Sync_Interval'],
				() => configureExternalPdpSync(),
			);
		},
		down: async () => {
			stopWatcher?.();
			stopCronWatcher?.();

			if (await cronJobs.has(EXTERNAL_PDP_SYNC_JOB)) {
				await cronJobs.remove(EXTERNAL_PDP_SYNC_JOB);
			}
		},
	});
});
