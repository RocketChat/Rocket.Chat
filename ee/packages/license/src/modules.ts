import type { LicenseModule } from './definition/LicenseModule';
import { moduleRemoved, moduleValidated } from './events/emitter';
import type { LicenseManager } from './license';

export function notifyValidatedModules(this: LicenseManager, licenseModules: LicenseModule[]) {
	licenseModules.forEach((module) => {
		this.modules.add(module);
		moduleValidated.call(this, module);
	});
}

export function notifyInvalidatedModules(this: LicenseManager, licenseModules: LicenseModule[]) {
	licenseModules.forEach((module) => {
		moduleRemoved.call(this, module);
		this.modules.delete(module);
	});
}

export function invalidateAll(this: LicenseManager) {
	notifyInvalidatedModules.call(this, [...this.modules]);
	this.modules.clear();
}

export function getModules(this: LicenseManager) {
	return [...this.modules];
}

export function hasModule(this: LicenseManager, module: LicenseModule) {
	return this.modules.has(module);
}

export function replaceModules(this: LicenseManager, newModules: LicenseModule[]) {
	for (const moduleName of newModules) {
		if (this.modules.has(moduleName)) {
			continue;
		}

		this.modules.add(moduleName);
		moduleValidated.call(this, moduleName);
	}

	for (const moduleName of this.modules) {
		if (newModules.includes(moduleName)) {
			continue;
		}

		moduleRemoved.call(this, moduleName);
		this.modules.delete(moduleName);
	}
}
