import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { Apps } from '../apps';

Meteor.startup(() => {
	async function disableAppsCallback() {
		void Apps.disableApps();
	}

	License.onInvalidateLicense(disableAppsCallback);
	License.onRemoveLicense(disableAppsCallback);
	// Disable apps that depend on add-ons (external modules) if they are invalidated
	License.onModule(async ({ module, external, valid }) => {
		if (!external || valid) return;

		const enabledApps = await Apps.installedApps({ enabled: true });

		if (!enabledApps) return;

		await Promise.all(
			enabledApps.map(async (app) => {
				if (app.getInfo().addon !== module) return;

				await Apps.getManager()?.disable(app.getID(), AppStatus.DISABLED, false);
			}),
		);
	});
});
