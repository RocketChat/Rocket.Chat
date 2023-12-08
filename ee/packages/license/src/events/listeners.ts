import type { LicenseLimitKind, LicenseModule, BehaviorWithContext, LicenseBehavior } from '@rocket.chat/core-typings';

import type { LicenseManager } from '../license';
import { hasModule } from '../modules';

/**
 * Invoked when the license changes some internal state. it's called to sync the license with other instances.
 */
export function onChange(this: LicenseManager, cb: () => void) {
	this.on('sync', cb);
}

export function onInstall(this: LicenseManager, cb: () => void) {
	if (this.hasValidLicense()) {
		cb();
	}
	this.on('installed', cb);
}

export function onRemoveLicense(this: LicenseManager, cb: () => void) {
	this.on('removed', cb);
}

export function onInvalidate(this: LicenseManager, cb: () => void) {
	if (!this.hasValidLicense()) {
		cb();
	}
	this.on('invalidate', cb);
}

export function onValidFeature(this: LicenseManager, feature: LicenseModule, cb: () => void) {
	this.on(`valid:${feature}`, cb);

	if (hasModule.call(this, feature)) {
		cb();
	}

	return (): void => {
		this.off(`valid:${feature}`, cb);
	};
}

export function onInvalidFeature(this: LicenseManager, feature: LicenseModule, cb: () => void) {
	this.on(`invalid:${feature}`, cb);

	if (!hasModule.call(this, feature)) {
		cb();
	}

	return (): void => {
		this.off(`invalid:${feature}`, cb);
	};
}

export function onToggledFeature(
	this: LicenseManager,
	feature: LicenseModule,
	{ up, down }: { up?: () => Promise<void> | void; down?: () => Promise<void> | void },
): () => void {
	let enabled = hasModule.call(this, feature);

	const offValidFeature = onValidFeature.bind(this)(feature, () => {
		if (!enabled) {
			void up?.();
			enabled = true;
		}
	});

	const offInvalidFeature = onInvalidFeature.bind(this)(feature, () => {
		if (enabled) {
			void down?.();
			enabled = false;
		}
	});

	if (enabled) {
		void up?.();
	}

	return (): void => {
		offValidFeature();
		offInvalidFeature();
	};
}

export function onModule(this: LicenseManager, cb: (data: { module: LicenseModule; valid: boolean }) => void) {
	this.on('module', cb);
}

export function onValidateLicense(this: LicenseManager, cb: () => void) {
	this.on('validate', cb);
}

export function onInvalidateLicense(this: LicenseManager, cb: () => void) {
	this.on('invalidate', cb);
}

export function onBehaviorTriggered(
	this: LicenseManager,
	behavior: Exclude<LicenseBehavior, 'prevent_installation'>,
	cb: (data: { reason: BehaviorWithContext['reason']; limit?: LicenseLimitKind }) => void,
) {
	this.on(`behavior:${behavior}`, cb);
}

export function onBehaviorToggled(
	this: LicenseManager,
	behavior: Exclude<LicenseBehavior, 'prevent_installation'>,
	cb: (data: { reason: BehaviorWithContext['reason']; limit?: LicenseLimitKind }) => void,
) {
	this.on(`behaviorToggled:${behavior}`, cb);
}

export function onLimitReached(this: LicenseManager, limitKind: LicenseLimitKind, cb: () => void) {
	this.on(`limitReached:${limitKind}`, cb);
}
