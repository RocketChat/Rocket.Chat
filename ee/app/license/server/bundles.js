const bundles = {
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

const getBundleFromModule = (moduleName) => {
	const match = moduleName.match(/(.*):\*$/);
	if (!match) {
		return;
	}

	return match[1];
};

export function isBundle(moduleName) {
	if (moduleName === '*') {
		return true;
	}

	const bundle = getBundleFromModule(moduleName);
	if (!bundle) {
		return false;
	}

	return true;
}

export function getBundleModules(moduleName) {
	if (moduleName === '*') {
		return Object.keys(bundles)
			.reduce((modules, bundle) => modules.concat(bundles[bundle]), []);
	}

	const bundle = getBundleFromModule(moduleName);
	if (!bundle) {
		return [];
	}

	return bundles[bundle];
}
