import { api } from '@rocket.chat/core-services';
import type { LicenseLimitKind } from '@rocket.chat/license';
import { License } from '@rocket.chat/license';
import { Subscriptions, Users, Settings, LivechatVisitors } from '@rocket.chat/models';
import { wrapExceptions } from '@rocket.chat/tools';
import moment from 'moment';

import { syncWorkspace } from '../../../../app/cloud/server/functions/syncWorkspace';
import { settings } from '../../../../app/settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { getAppCount } from './lib/getAppCount';

settings.watch<string>('Site_Url', (value) => {
	if (value) {
		void License.setWorkspaceUrl(value);
	}
});

License.onValidateLicense(async () => {
	await Settings.updateValueById('Enterprise_License', License.encryptedLicense);
	await Settings.updateValueById('Enterprise_License_Status', 'Valid');
});

License.onInvalidateLicense(async () => {
	await Settings.updateValueById('Enterprise_License_Status', 'Invalid');
});

const applyLicense = async (license: string, isNewLicense: boolean): Promise<boolean> => {
	const enterpriseLicense = (license ?? '').trim();
	if (!enterpriseLicense) {
		return false;
	}

	if (enterpriseLicense === License.encryptedLicense) {
		return false;
	}

	try {
		return License.setLicense(enterpriseLicense, isNewLicense);
	} catch {
		return false;
	}
};

const syncByTrigger = async (context: string) => {
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
	if (existingData.signed === signed && existingData[context] === period) {
		return;
	}

	await Settings.updateValueById(
		'Enterprise_License_Data',
		JSON.stringify({
			...(existingData.signed === signed && existingData),
			...existingData,
			[context]: period,
			signed,
		}),
	);

	await syncWorkspace();
};

// When settings are loaded, apply the current license if there is one.
settings.onReady(async () => {
	if (!(await applyLicense(settings.get<string>('Enterprise_License') ?? '', false))) {
		// License from the envvar is always treated as new, because it would have been saved on the setting if it was already in use.
		if (process.env.ROCKETCHAT_LICENSE && !License.hasValidLicense()) {
			await applyLicense(process.env.ROCKETCHAT_LICENSE, true);
		}
	}

	// After the current license is already loaded, watch the setting value to react to new licenses being applied.
	settings.watch<string>('Enterprise_License', async (license) => applyLicense(license, true));

	callbacks.add('workspaceLicenseChanged', async (updatedLicense) => applyLicense(updatedLicense, true));

	License.onBehaviorTriggered('prevent_action', (context) => syncByTrigger(`prevent_action_${context.limit}`));

	License.onBehaviorTriggered('start_fair_policy', async (context) => syncByTrigger(`start_fair_policy_${context.limit}`));

	License.onBehaviorTriggered('disable_modules', async (context) => syncByTrigger(`disable_modules_${context.limit}`));

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
});

License.setLicenseLimitCounter('activeUsers', () => Users.getActiveLocalUserCount());
License.setLicenseLimitCounter('guestUsers', () => Users.getActiveLocalGuestCount());
License.setLicenseLimitCounter('roomsPerGuest', async (context) => (context?.userId ? Subscriptions.countByUserId(context.userId) : 0));
License.setLicenseLimitCounter('privateApps', () => getAppCount('private'));
License.setLicenseLimitCounter('marketplaceApps', () => getAppCount('marketplace'));
License.setLicenseLimitCounter('monthlyActiveContacts', async () => LivechatVisitors.countVisitorsOnPeriod(moment.utc().format('YYYY-MM')));
