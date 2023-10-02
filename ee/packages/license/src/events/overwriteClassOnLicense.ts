import type { LicenseModule } from '../definition/LicenseModule';
import type { LicenseManager } from '../license';
import { onLicense } from './deprecated';

interface IOverrideClassProperties {
	[key: string]: (...args: any[]) => any;
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
			original.prototype[key] = function (...args: any[]): any {
				return value.call(this, originalFn, ...args);
			};
		});
	});
}
