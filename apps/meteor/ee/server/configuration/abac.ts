import { Abac } from '@rocket.chat/core-services';
import { cronJobs } from '@rocket.chat/cron';
import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';
import { isValidCron } from 'cron-validator';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../app/settings/server';
import { beforeSaveSetting } from '../../../app/settings/server/lib/beforeSaveSetting';
import { callbacks } from '../../../server/lib/callbacks';
import { afterUserRolesChanged } from '../../../server/lib/roles/afterUserRolesChanged';
import { LDAPEE } from '../sdk';

const VIRTRU_PDP_SYNC_JOB = 'ABAC_Virtru_PDP_Sync';
const abacLogger = new Logger('ABAC');

beforeSaveSetting.patch(async (next, settingId, newValue) => {
	if (
		settingId === 'ABAC_Use_User_Roles_As_Attributes' &&
		newValue === false &&
		(await Abac.isAbacAttributeInUseByAnyRoom())
	) {
		throw new Meteor.Error(
			'error-abac-role-attribute-in-use',
			'Cannot disable `Use user roles as ABAC attributes` while rooms use the `RC-user-role` attribute. Remove it from those rooms first.',
		);
	}

	await next(settingId, newValue);
});

afterUserRolesChanged.patch(async (next, userId) => {
	if (await Abac.isRoleAttributeFeatureActive()) {
		await Abac.syncUserRoleAttribute(userId);
	}
	await next(userId);
});

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

			callbacks.add(
				'afterCreateUser',
				async (user) => {
					if (!(await Abac.isRoleAttributeFeatureActive()) || !user?._id || !user.roles?.length) {
						return user;
					}
					try {
						await Abac.syncUserRoleAttribute(user._id);
					} catch (err) {
						abacLogger.error({ msg: 'Failed to sync RC-user-role attribute on user create', userId: user._id, err });
					}
					return user;
				},
				callbacks.priority.MEDIUM,
				'abac.syncUserRoleAttributeOnCreate',
			);

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

				if (!cronValue || !isValidCron(cronValue)) {
					return;
				}

				await cronJobs.add(VIRTRU_PDP_SYNC_JOB, cronValue, () => Abac.evaluateRoomMembership());
			}

			stopCronWatcher = settings.watchMultiple(
				['ABAC_Enabled', 'ABAC_PDP_Type', 'ABAC_Virtru_Sync_Interval'],
				() => void configureVirtruPdpSync(),
			);
		},
		down: async () => {
			stopWatcher?.();
			stopCronWatcher?.();
			callbacks.remove('afterCreateUser', 'abac.syncUserRoleAttributeOnCreate');

			if (await cronJobs.has(VIRTRU_PDP_SYNC_JOB)) {
				await cronJobs.remove(VIRTRU_PDP_SYNC_JOB);
			}
		},
	});
});
