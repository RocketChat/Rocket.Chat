import { CoreModules, type ExternalModule, type LicenseModule } from '@rocket.chat/core-typings';

import { moduleRemoved, moduleValidated } from './events/emitter';
import type { LicenseManager } from './license';

export function isLicenseModule(module: string): module is LicenseModule {
	return CoreModules.includes(module as LicenseModule);
}

export function notifyValidatedModules(this: LicenseManager, licenseModules: string[]) {
	licenseModules.forEach((module) => {
		this.modules.add(module);
		moduleValidated.call(this, module);
	});
}

export function notifyInvalidatedModules(this: LicenseManager, licenseModules: string[]) {
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

export function getModuleDefinition(this: LicenseManager, moduleName: string) {
	const license = this.getLicense();

	if (!license) {
		return;
	}

	const moduleDefinition = license.grantedModules.find(({ module }) => module === moduleName);

	return moduleDefinition;
}

export function getExternalModules(this: LicenseManager): ExternalModule[] {
	const license = this.getLicense();

	if (!license) {
		return [];
	}

	return [...license.grantedModules.filter<ExternalModule>((value): value is ExternalModule => !isLicenseModule(value.module))];
}

export function hasModule(this: LicenseManager, module: string) {
	return this.modules.has(module);
}

export function replaceModules(this: LicenseManager, newModules: string[]): boolean {
	let anyChange = false;
	for (const moduleName of newModules) {
		if (this.modules.has(moduleName)) {
			continue;
		}

		this.modules.add(moduleName);
		moduleValidated.call(this, moduleName);
		anyChange = true;
	}

	for (const moduleName of this.modules) {
		if (newModules.includes(moduleName)) {
			continue;
		}

		moduleRemoved.call(this, moduleName);
		this.modules.delete(moduleName);
		anyChange = true;
	}

	return anyChange;
}
