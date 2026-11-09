import type { LicenseModule } from '@rocket.chat/core-typings';

import type { LicenseManager } from '../license.js';
import { hasModule } from '../modules.js';

// #TODO: Remove this onLicense handler
export function onLicense(this: LicenseManager, feature: LicenseModule, cb: (...args: any[]) => void): void | Promise<void> {
	if (hasModule.call(this, feature)) {
		return cb();
	}

	this.once(`valid:${feature}`, cb);
}
