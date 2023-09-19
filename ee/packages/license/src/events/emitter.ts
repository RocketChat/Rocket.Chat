import { EventEmitter } from 'events';

import type { LicenseModule } from '../definition/LicenseModule';
import { logger } from '../logger';

export const EnterpriseLicenses = new EventEmitter();

export const licenseValidated = () => {
	try {
		EnterpriseLicenses.emit('validate');
	} catch (error) {
		logger.error({ msg: 'Error running license validated event', error });
	}
};

export const licenseRemoved = () => {
	try {
		EnterpriseLicenses.emit('invalidate');
	} catch (error) {
		logger.error({ msg: 'Error running license invalidated event', error });
	}
};

export const moduleValidated = (module: LicenseModule) => {
	try {
		EnterpriseLicenses.emit('module', { module, valid: true });
		EnterpriseLicenses.emit(`valid:${module}`);
	} catch (error) {
		logger.error({ msg: 'Error running module added event', error });
	}
};

export const moduleRemoved = (module: LicenseModule) => {
	try {
		EnterpriseLicenses.emit('module', { module, valid: false });
		EnterpriseLicenses.emit(`invalid:${module}`);
	} catch (error) {
		logger.error({ msg: 'Error running module removed event', error });
	}
};
