import type { LicenseModule } from '@rocket.chat/core-typings';

import type { LicenseManager } from '../license.js';
import { onLicense } from './deprecated.js';

interface IOverrideClassProperties {
	[key: string]: (...args: any[]) => unknown;
}

type Class = { new (...args: any[]): any };

export async function overwriteClassOnLicense(
	this: LicenseManager,

	license: LicenseModule,
	original: Class,
	overwrite: IOverrideClassProperties,
): Promise<void> {
	await onLicense.call(this, license, () => {
		Object.entries(overwrite).forEach(([key, value]) => {
			const originalFn = original.prototype[key];
			original.prototype[key] = function (...args: unknown[]): unknown {
				return value.call(this, originalFn, ...args);
			};
		});
	});
}
