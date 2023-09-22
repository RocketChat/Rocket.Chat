import type { LicenseLimitKind } from '../definition/ILicenseV3';
import type { LicenseModule } from '../definition/LicenseModule';
import { hasModule } from '../modules';
import { EnterpriseLicenses } from './emitter';

export const onValidFeature = (feature: LicenseModule, cb: () => void) => {
	EnterpriseLicenses.on(`valid:${feature}`, cb);

	if (hasModule(feature)) {
		cb();
	}

	return (): void => {
		EnterpriseLicenses.off(`valid:${feature}`, cb);
	};
};

export const onInvalidFeature = (feature: LicenseModule, cb: () => void) => {
	EnterpriseLicenses.on(`invalid:${feature}`, cb);

	if (!hasModule(feature)) {
		cb();
	}

	return (): void => {
		EnterpriseLicenses.off(`invalid:${feature}`, cb);
	};
};

export const onToggledFeature = (
	feature: LicenseModule,
	{ up, down }: { up?: () => Promise<void> | void; down?: () => Promise<void> | void },
): (() => void) => {
	let enabled = hasModule(feature);

	const offValidFeature = onValidFeature(feature, () => {
		if (!enabled) {
			void up?.();
			enabled = true;
		}
	});

	const offInvalidFeature = onInvalidFeature(feature, () => {
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
};

export const onModule = (cb: (...args: any[]) => void) => {
	EnterpriseLicenses.on('module', cb);
};

export const onValidateLicense = (cb: (...args: any[]) => void) => {
	EnterpriseLicenses.on('validate', cb);
};

export const onInvalidateLicense = (cb: (...args: any[]) => void) => {
	EnterpriseLicenses.on('invalidate', cb);
};

export const onLimitReached = (limitKind: LicenseLimitKind, cb: (...args: any[]) => void) => {
	EnterpriseLicenses.on(`limitReached:${limitKind}`, cb);
};
