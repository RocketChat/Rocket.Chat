interface IBundle {
	[key: string]: string[];
}

const bundles: IBundle = {
	enterprise: [
		'auditing',
		'canned-responses',
		'ldap-enterprise',
		'livechat-enterprise',
		'engagement-dashboard',
	],
	pro: [
	],
};

const getBundleFromModule = (moduleName: string): string|undefined => {
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

export function getBundleModules(moduleName: string): string[] {
	if (moduleName === '*') {
		return Object.keys(bundles)
			.reduce<string[]>((modules, bundle) => modules.concat(bundles[bundle]), []);
	}

	const bundle = getBundleFromModule(moduleName);
	if (!bundle) {
		return [];
	}

	return bundles[bundle];
}
