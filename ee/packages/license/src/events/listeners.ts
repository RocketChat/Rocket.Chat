import type { LicenseLimitKind } from '../definition/ILicenseV3';
import type { LicenseModule } from '../definition/LicenseModule';
import type { LicenseManager } from '../license';
import { hasModule } from '../modules';

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

export function onModule(this: LicenseManager, cb: (...args: any[]) => void) {
	this.on('module', cb);
}

export function onValidateLicense(this: LicenseManager, cb: (...args: any[]) => void) {
	this.on('validate', cb);
}

export function onInvalidateLicense(this: LicenseManager, cb: (...args: any[]) => void) {
	this.on('invalidate', cb);
}

export function onLimitReached(this: LicenseManager, limitKind: LicenseLimitKind, cb: (...args: any[]) => void) {
	this.on(`limitReached:${limitKind}`, cb);
}
