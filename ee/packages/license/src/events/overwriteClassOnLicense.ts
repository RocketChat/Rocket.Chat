import type { LicenseModule } from '../definition/LicenseModule';
import { onLicense } from './deprecated';

interface IOverrideClassProperties {
	[key: string]: (...args: any[]) => any;
}

type Class = { new (...args: any[]): any };

export async function overwriteClassOnLicense(license: LicenseModule, original: Class, overwrite: IOverrideClassProperties): Promise<void> {
	await onLicense(license, () => {
		Object.entries(overwrite).forEach(([key, value]) => {
			const originalFn = original.prototype[key];
			original.prototype[key] = function (...args: any[]): any {
				return value.call(this, originalFn, ...args);
			};
		});
	});
}
