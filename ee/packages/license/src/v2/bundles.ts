import { CoreModules, type LicenseModule } from '@rocket.chat/core-typings';

interface IBundle {
	[key: string]: readonly LicenseModule[];
}

const bundles: IBundle = {
	enterprise: CoreModules,
	pro: [],
};

export const getBundleFromModule = (moduleName: string): string | undefined => {
	const match = moduleName.match(/(.*):\*$/);
	if (!match) {
		return;
	}

	return match[1];
};

export function isBundle(moduleName: string): boolean {
	if (moduleName === '*') {
		return true;
	}

	const bundle = getBundleFromModule(moduleName);
	if (!bundle) {
		return false;
	}

	return true;
}

export function getBundleModules(moduleName: string): readonly string[] {
	if (moduleName === '*') {
		return Object.keys(bundles).reduce<string[]>((modules, bundle) => modules.concat(bundles[bundle]), []);
	}

	const bundle = getBundleFromModule(moduleName);
	if (!bundle || !bundles[bundle]) {
		return [];
	}

	return bundles[bundle];
}
