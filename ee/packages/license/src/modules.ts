import type { LicenseModule } from './definition/LicenseModule';
import { moduleRemoved, moduleValidated } from './events/emitter';

export const modules = new Set<LicenseModule>();

export const notifyValidatedModules = (licenseModules: LicenseModule[]) => {
	licenseModules.forEach((module) => {
		modules.add(module);
		moduleValidated(module);
	});
};

export const notifyInvalidatedModules = (licenseModules: LicenseModule[]) => {
	licenseModules.forEach((module) => {
		moduleRemoved(module);
		modules.delete(module);
	});
};

export const invalidateAll = () => {
	notifyInvalidatedModules([...modules]);
	modules.clear();
};

export const getModules = () => [...modules];

export const hasModule = (module: LicenseModule) => modules.has(module);

export const replaceModules = (newModules: LicenseModule[]) => {
	for (const moduleName of newModules) {
		if (modules.has(moduleName)) {
			continue;
		}

		modules.add(moduleName);
		moduleValidated(moduleName);
	}

	for (const moduleName of modules) {
		if (newModules.includes(moduleName)) {
			continue;
		}

		moduleRemoved(moduleName);
		modules.delete(moduleName);
	}
};
