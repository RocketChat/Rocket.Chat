import { EventEmitter } from 'events';

import type { LicenseModule } from '../definition/LicenseModule';

export const EnterpriseLicenses = new EventEmitter();

export const licenseValidated = () => EnterpriseLicenses.emit('validate');

export const licenseRemoved = () => EnterpriseLicenses.emit('invalidate');

export const moduleValidated = (module: LicenseModule) => {
	EnterpriseLicenses.emit('module', { module, valid: true });
	EnterpriseLicenses.emit(`valid:${module}`);
};

export const moduleRemoved = (module: LicenseModule) => {
	EnterpriseLicenses.emit('module', { module, valid: false });
	EnterpriseLicenses.emit(`invalid:${module}`);
};
