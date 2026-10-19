import type { LicenseModule } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';

import { SystemLogger } from './logger/system';

const warned = new Set<LicenseModule>();

// Checked on login instead of on startup so the license is already loaded and
// workspaces that do have the module never see the warning.
export function warnUnlicensedAuthService(service: 'LDAP' | 'SAML', module: LicenseModule): void {
	if (warned.has(module) || License.hasModule(module)) {
		return;
	}

	warned.add(module);

	SystemLogger.warn({
		msg: `${service} authentication will require a Premium plan starting on version 9.0.0. This workspace has no license covering it, so ${service} logins will stop working after the upgrade.`,
		module,
	});
}
