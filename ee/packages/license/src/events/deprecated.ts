import type { LicenseModule } from '../definition/LicenseModule';
import type { LicenseManager } from '../license';
import { hasModule } from '../modules';

// #TODO: Remove this onLicense handler
export function onLicense(this: LicenseManager, feature: LicenseModule, cb: (...args: any[]) => void): void | Promise<void> {
	if (hasModule.call(this, feature)) {
		return cb();
	}

	this.once(`valid:${feature}`, cb);
}
