import { License } from '@rocket.chat/license';
import { Subscriptions, Users, Settings } from '@rocket.chat/models';
import { wrapExceptions } from '@rocket.chat/tools';

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

// When settings are loaded, apply the current license if there is one.
settings.onReady(async () => {
	License.onBehaviorTriggered('start_fair_policy', async () => {
		if (!License.encryptedLicense) {
			return;
		}

		const dataJson = settings.get<string>('Enterprise_License_Data');
		const existingData: Record<string, any> = dataJson ? wrapExceptions(() => JSON.parse(dataJson)).catch(() => ({})) : {};
		const data =
			existingData?.encryptedLicense === License.encryptedLicense ? existingData : { encryptedLicense: License.encryptedLicense };

		if (data.start_fair_policy) {
			return;
		}

		data.start_fair_policy = true;
		await syncWorkspace();
		await Settings.updateValueById('Enterprise_License_Data', JSON.stringify(data));
	});

	const enterpriseLicense = settings.get<string>('Enterprise_License');
	if (enterpriseLicense && String(enterpriseLicense).trim() !== '') {
		try {
			await License.setLicense(enterpriseLicense, false);
		} catch {
			// ;
		}
	}

	// License from the envvar is always treated as new, because it would have been saved on the setting if it was already in use.
	if (process.env.ROCKETCHAT_LICENSE && !License.hasValidLicense()) {
		try {
			await License.setLicense(process.env.ROCKETCHAT_LICENSE);
		} catch {
			// ;
		}
	}

	// After the current license is already loaded, watch the setting value to react to new licenses being saved thered directly.
	settings.watch<string>('Enterprise_License', async (license) => {
		if (!license || String(license).trim() === '') {
			return;
		}

		if (license === License.encryptedLicense) {
			return;
		}

		try {
			await License.setLicense(license);
		} catch {
			// ;
		}
	});
});

callbacks.add('workspaceLicenseChanged', async (updatedLicense) => {
	try {
		await License.setLicense(updatedLicense);
	} catch (_error) {
		// Ignore
	}
});

License.setLicenseLimitCounter('activeUsers', () => Users.getActiveLocalUserCount());
License.setLicenseLimitCounter('guestUsers', () => Users.getActiveLocalGuestCount());
License.setLicenseLimitCounter('roomsPerGuest', async (context) => (context?.userId ? Subscriptions.countByUserId(context.userId) : 0));
License.setLicenseLimitCounter('privateApps', () => getAppCount('private'));
License.setLicenseLimitCounter('marketplaceApps', () => getAppCount('marketplace'));
// #TODO: Get real value
License.setLicenseLimitCounter('monthlyActiveContacts', async () => 0);
