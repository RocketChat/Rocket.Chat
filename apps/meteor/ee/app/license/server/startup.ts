import { api } from '@rocket.chat/core-services';
import type { LicenseLimitKind } from '@rocket.chat/core-typings';
import { applyLicense, applyLicenseOrRemove, License } from '@rocket.chat/license';
import { Subscriptions, Users, Settings, LivechatContacts } from '@rocket.chat/models';
import { wrapExceptions } from '@rocket.chat/tools';
import moment from 'moment';

import { getAppCount } from './lib/getAppCount';
import { syncWorkspace } from '../../../../app/cloud/server/functions/syncWorkspace';
import { notifyOnSettingChangedById } from '../../../../app/lib/server/lib/notifyListener';
import { settings } from '../../../../app/settings/server';
import { callbacks } from '../../../../lib/callbacks';

export const startLicense = async () => {
	settings.watch<string>('Site_Url', (value) => {
		if (value) {
			void License.setWorkspaceUrl(value);
		}
	});

	License.onValidateLicense(async () => {
		(await Settings.updateValueById('Enterprise_License', License.encryptedLicense)).modifiedCount &&
			void notifyOnSettingChangedById('Enterprise_License');

		(await Settings.updateValueById('Enterprise_License_Status', 'Valid')).modifiedCount &&
			void notifyOnSettingChangedById('Enterprise_License_Status');
	});

	License.onInvalidateLicense(async () => {
		(await Settings.updateValueById('Enterprise_License_Status', 'Invalid')).modifiedCount &&
			void notifyOnSettingChangedById('Enterprise_License_Status');
	});

	License.onRemoveLicense(async () => {
		(await Settings.updateValueById('Enterprise_License', '')).modifiedCount &&
			void notifyOnSettingChangedById('Enterprise_License_Status');

		(await Settings.updateValueById('Enterprise_License_Status', 'Invalid')).modifiedCount &&
			void notifyOnSettingChangedById('Enterprise_License_Status');
	});

	/**
	 * This is a debounced function that will sync the workspace data to the cloud.
	 * it caches the context, waits for a second and then syncs the data.
	 */

	const syncByTriggerDebounced = (() => {
		let timeout: NodeJS.Timeout | undefined;
		const contexts: Set<string> = new Set();
		return async (context: string) => {
			contexts.add(context);
			if (timeout) {
				clearTimeout(timeout);
			}

			timeout = setTimeout(() => {
				timeout = undefined;
				void syncByTrigger([...contexts]);
				contexts.clear();
			}, 1000);
		};
	})();

	const syncByTrigger = async (contexts: string[]) => {
		if (!License.encryptedLicense) {
			return;
		}

		const existingData = wrapExceptions(() => JSON.parse(settings.get<string>('Enterprise_License_Data'))).catch(() => ({})) ?? {};

		const date = new Date();

		const day = date.getDate();
		const month = date.getMonth() + 1;
		const year = date.getFullYear();

		const period = `${year}-${month}-${day}`;

		const [, , signed] = License.encryptedLicense.split('.');

		// Check if this sync has already been done. Based on License, behavior.

		if ([...contexts.values()].every((context) => existingData.signed === signed && existingData[context] === period)) {
			return;
		}

		const obj = Object.fromEntries(contexts.map((context) => [context, period]));

		(
			await Settings.updateValueById(
				'Enterprise_License_Data',
				JSON.stringify({
					...(existingData.signed === signed && existingData),
					...existingData,
					...obj,
					signed,
				}),
			)
		).modifiedCount && void notifyOnSettingChangedById('Enterprise_License_Data');

		try {
			await syncWorkspace();
		} catch (error) {
			console.error(error);
		}
	};

	License.setLicenseLimitCounter('activeUsers', () => Users.getActiveLocalUserCount());
	License.setLicenseLimitCounter('guestUsers', () => Users.getActiveLocalGuestCount());
	License.setLicenseLimitCounter('roomsPerGuest', async (context) => (context?.userId ? Subscriptions.countByUserId(context.userId) : 0));
	License.setLicenseLimitCounter('privateApps', () => getAppCount('private'));
	License.setLicenseLimitCounter('marketplaceApps', () => getAppCount('marketplace'));
	License.setLicenseLimitCounter('monthlyActiveContacts', () => LivechatContacts.countContactsOnPeriod(moment.utc().format('YYYY-MM')));

	return new Promise<void>((resolve) => {
		// When settings are loaded, apply the current license if there is one.
		settings.onReady(async () => {
			import('./airGappedRestrictions');
			if (!(await applyLicense(settings.get<string>('Enterprise_License') ?? '', false))) {
				// License from the envvar is always treated as new, because it would have been saved on the setting if it was already in use.
				if (process.env.ROCKETCHAT_LICENSE && !License.hasValidLicense()) {
					await applyLicense(process.env.ROCKETCHAT_LICENSE, true);
				}
			}

			// After the current license is already loaded, watch the setting value to react to new licenses being applied.
			settings.change<string>('Enterprise_License', (license) => applyLicenseOrRemove(license, true));

			callbacks.add('workspaceLicenseRemoved', () => License.remove());

			callbacks.add('workspaceLicenseChanged', (updatedLicense) => applyLicense(updatedLicense, true));

			License.onInstall(async () => void api.broadcast('license.actions', {} as Record<Partial<LicenseLimitKind>, boolean>));

			License.onInvalidate(async () => void api.broadcast('license.actions', {} as Record<Partial<LicenseLimitKind>, boolean>));

			License.onBehaviorTriggered('prevent_action', (context) => syncByTriggerDebounced(`prevent_action_${context.limit}`));

			License.onBehaviorTriggered('start_fair_policy', async (context) => syncByTriggerDebounced(`start_fair_policy_${context.limit}`));

			License.onBehaviorTriggered('disable_modules', async (context) => syncByTriggerDebounced(`disable_modules_${context.limit}`));

			License.onChange(() => api.broadcast('license.sync'));

			License.onBehaviorToggled('prevent_action', (context) => {
				if (!context.limit) {
					return;
				}
				void api.broadcast('license.actions', {
					[context.limit]: true,
				} as Record<Partial<LicenseLimitKind>, boolean>);
			});

			License.onBehaviorToggled('allow_action', (context) => {
				if (!context.limit) {
					return;
				}
				void api.broadcast('license.actions', {
					[context.limit]: false,
				} as Record<Partial<LicenseLimitKind>, boolean>);
			});
			resolve();
		});
	});
};
