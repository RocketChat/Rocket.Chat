import type { LicenseLimitKind } from '../definition/ILicenseV3';
import type { LicenseBehavior } from '../definition/LicenseBehavior';
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

export function limitReached(
	this: LicenseManager,
	limitKind: Exclude<LicenseLimitKind, 'roomsPerGuest'>,
	limitBehavior: Exclude<LicenseBehavior, 'prevent_installation'>,
) {
	try {
		// This will never be emitted for limits that fallback to "not reached" when missing context params (eg: roomsPerGuest)
		this.emit(`limitReached:${limitKind}:${limitBehavior}`);
	} catch (error) {
		logger.error({ msg: 'Error running limit reached event', error });
	}
}

export function licenseValidated(this: LicenseManager) {
	try {
		this.emit('validate');
	} catch (error) {
		logger.error({ msg: 'Error running license validated event', error });
	}
}

export function licenseInvalidated(this: LicenseManager) {
	try {
		this.emit('invalidate');
	} catch (error) {
		logger.error({ msg: 'Error running license invalidated event', error });
	}
}
