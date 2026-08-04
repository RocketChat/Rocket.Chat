import type { BehaviorWithContext, LicenseModule } from '@rocket.chat/core-typings';

import type { LicenseManager } from '../license';
import { logger } from '../logger';
import { isInternalModuleName } from '../modules';

export function moduleValidated(this: LicenseManager, module: LicenseModule) {
	try {
		const external = !isInternalModuleName(module);

		this.emit('module', { module, external, valid: true });
	} catch (err) {
		logger.error({ msg: 'Error running module (valid: true) event', module, err });
	}

	try {
		this.emit(`valid:${module}`);
	} catch (err) {
		logger.error({ msg: 'Error running module added event', module, err });
	}
}

export function moduleRemoved(this: LicenseManager, module: LicenseModule) {
	try {
		const external = !isInternalModuleName(module);

		this.emit('module', { module, external, valid: false });
	} catch (err) {
		logger.error({ msg: 'Error running module (valid: false) event', module, err });
	}

	try {
		this.emit(`invalid:${module}`);
	} catch (err) {
		logger.error({ msg: 'Error running module removed event', module, err });
	}
}

export function behaviorTriggered(this: LicenseManager, options: BehaviorWithContext) {
	const { behavior, reason, modules: _, ...rest } = options;

	try {
		this.emit(`behavior:${behavior}`, {
			reason,
			...rest,
		});
	} catch (err) {
		logger.error({ msg: 'Error running behavior triggered event', behavior, err });
	}

	if (!['prevent_action'].includes(behavior)) {
		return;
	}

	if (reason !== 'limit' || !(`limit` in rest) || !rest.limit) {
		return;
	}

	try {
		this.emit(`limitReached:${rest.limit}`);
	} catch (err) {
		logger.error({ msg: 'Error running limit reached event', limit: rest.limit, err });
	}
}

export function behaviorTriggeredToggled(this: LicenseManager, options: BehaviorWithContext) {
	const { behavior, reason, modules: _, ...rest } = options;

	try {
		this.emit(`behaviorToggled:${behavior}`, {
			reason,
			...rest,
		});
	} catch (err) {
		logger.error({ msg: 'Error running behavior triggered event', behavior, err });
	}
}

export function licenseValidated(this: LicenseManager) {
	try {
		this.emit('validate');
	} catch (err) {
		logger.error({ msg: 'Error running license validated event', err });
	}
}

export function licenseInvalidated(this: LicenseManager) {
	try {
		this.emit('invalidate');
	} catch (err) {
		logger.error({ msg: 'Error running license invalidated event', err });
	}
}
