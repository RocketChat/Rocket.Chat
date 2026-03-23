import { Abac } from '@rocket.chat/core-services';
import { cronJobs } from '@rocket.chat/cron';
import { License } from '@rocket.chat/license';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../app/settings/server';
import { LDAPEE } from '../sdk';

const EXTERNAL_PDP_SYNC_JOB = 'ABAC_External_PDP_Sync';

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
				if (value && settings.get<string>('ABAC_PDP_Type') !== 'external') {
					await LDAPEE.syncUsersAbacAttributes(Users.findLDAPUsers());
				}
			});

			let lastSchedule: string;
			async function configureExternalPdpSync(): Promise<void> {
				const abacEnabled = settings.get('ABAC_Enabled');
				const pdpType = settings.get<string>('ABAC_PDP_Type');

				if (!abacEnabled || pdpType !== 'external') {
					if (await cronJobs.has(EXTERNAL_PDP_SYNC_JOB)) {
						await cronJobs.remove(EXTERNAL_PDP_SYNC_JOB);
					}
					return;
				}

				const cronValue = settings.get<string>('ABAC_External_Sync_Interval');

				if (cronValue !== lastSchedule && (await cronJobs.has(EXTERNAL_PDP_SYNC_JOB))) {
					await cronJobs.remove(EXTERNAL_PDP_SYNC_JOB);
				}

				lastSchedule = cronValue;
				await cronJobs.add(EXTERNAL_PDP_SYNC_JOB, cronValue, () => Abac.evaluateRoomMembership());
			}

			stopCronWatcher = settings.watchMultiple(['ABAC_PDP_Type', 'ABAC_External_Sync_Interval'], () => configureExternalPdpSync());
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
