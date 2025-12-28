import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { LicenseImp } from '@rocket.chat/license';

import { i18n } from '../../../../server/lib/i18n';
import { sendMessagesToAdmins } from '../../../../server/lib/sendMessagesToAdmins';
import { Apps } from '../../apps';

type OnModuleCallbackParameter = Parameters<Parameters<LicenseImp['onModule']>[0]>[0];

export async function _disableAppsWithAddonsCallback(
	deps: { Apps: typeof Apps; sendMessagesToAdmins: typeof sendMessagesToAdmins },
	{ module, external, valid }: OnModuleCallbackParameter,
) {
	if (!external || valid) return;

	const enabledApps = await deps.Apps.installedApps({ enabled: true });

	if (!enabledApps) return;

	const affectedApps: string[] = [];

	await Promise.all(
		enabledApps.map(async (app) => {
			if (app.getInfo().addon !== module) return;

			affectedApps.push(app.getName());

			return deps.Apps.getManager()?.disable(app.getID(), AppStatus.DISABLED, false);
		}),
	);

	if (!affectedApps.length) return;

	await deps.sendMessagesToAdmins({
		msgs: async ({ adminUser }) => ({
			msg: i18n.t('App_has_been_disabled_addon_message', {
				lng: adminUser.language || 'en',
				count: affectedApps.length,
				appNames: affectedApps,
			}),
		}),
	});
}

export const disableAppsWithAddonsCallback = (ctx: OnModuleCallbackParameter) =>
	_disableAppsWithAddonsCallback({ Apps, sendMessagesToAdmins }, ctx);
