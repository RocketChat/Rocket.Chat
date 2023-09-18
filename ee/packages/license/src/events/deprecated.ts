import type { LicenseModule } from '../definition/LicenseModule';
import { hasModule } from '../modules';
import { EnterpriseLicenses } from './emitter';

// #TODO: Remove this onLicense handler
export const onLicense = (feature: LicenseModule, cb: (...args: any[]) => void): void | Promise<void> => {
	if (hasModule(feature)) {
		return cb();
	}

	EnterpriseLicenses.once(`valid:${feature}`, cb);
};
