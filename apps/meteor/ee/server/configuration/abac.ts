import { Abac } from '@rocket.chat/core-services';
import { cronJobs } from '@rocket.chat/cron';
import { License } from '@rocket.chat/license';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../app/settings/server';
import { LDAPEE } from '../sdk';

const VIRTRU_PDP_SYNC_JOB = 'ABAC_Virtru_PDP_Sync';

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
				if (value && settings.get<string>('ABAC_PDP_Type') !== 'virtru') {
					await LDAPEE.syncUsersAbacAttributes(Users.findLDAPUsers());
				}
			});

			async function configureVirtruPdpSync(): Promise<void> {
				if (await cronJobs.has(VIRTRU_PDP_SYNC_JOB)) {
					await cronJobs.remove(VIRTRU_PDP_SYNC_JOB);
				}

				const abacEnabled = settings.get('ABAC_Enabled');
				const pdpType = settings.get<string>('ABAC_PDP_Type');

				if (!abacEnabled || pdpType !== 'virtru') {
					return;
				}

				const cronValue = settings.get<string>('ABAC_Virtru_Sync_Interval');

				await cronJobs.add(VIRTRU_PDP_SYNC_JOB, cronValue, () => Abac.evaluateRoomMembership());
			}

			stopCronWatcher = settings.watchMultiple(['ABAC_PDP_Type', 'ABAC_Virtru_Sync_Interval'], () => configureVirtruPdpSync());
		},
		down: async () => {
			stopWatcher?.();
			stopCronWatcher?.();

			if (await cronJobs.has(VIRTRU_PDP_SYNC_JOB)) {
				await cronJobs.remove(VIRTRU_PDP_SYNC_JOB);
			}
		},
	});
});
