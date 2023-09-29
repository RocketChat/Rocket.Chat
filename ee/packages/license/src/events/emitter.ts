import type { LicenseLimitKind } from '../definition/ILicenseV3';
import type { LicenseModule } from '../definition/LicenseModule';
import type { LicenseManager } from '../license';
import { logger } from '../logger';

export function moduleValidated(this: LicenseManager, module: LicenseModule) {
	try {
		this.emit('module', { module, valid: true });
		this.emit(`valid:${module}`);
	} catch (error) {
		logger.error({ msg: 'Error running module added event', error });
	}
}

export function moduleRemoved(this: LicenseManager, module: LicenseModule) {
	try {
		this.emit('module', { module, valid: false });
		this.emit(`invalid:${module}`);
	} catch (error) {
		logger.error({ msg: 'Error running module removed event', error });
	}
}

export function limitReached(this: LicenseManager, limitKind: LicenseLimitKind) {
	try {
		this.emit(`limitReached:${limitKind}`);
	} catch (error) {
		logger.error({ msg: 'Error running limit reached event', error });
	}
}
