import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { LicenseImp } from '@rocket.chat/license';

import type { Apps } from '../../apps';

type OnModuleCallbackParameter = Parameters<Parameters<LicenseImp['onModule']>[0]>[0];

export const makeDisableAppsWithAddonsCallback = (deps: { Apps: typeof Apps }) =>
	async function disableAppsWithAddonsCallback({ module, external, valid }: OnModuleCallbackParameter) {
		if (!external || valid) return;

		const enabledApps = await deps.Apps.installedApps({ enabled: true });

		if (!enabledApps) return;

		await Promise.all(
			enabledApps.map(async (app) => {
				if (app.getInfo().addon !== module) return;

				return deps.Apps.getManager()?.disable(app.getID(), AppStatus.DISABLED, false);
			}),
		);
	};
