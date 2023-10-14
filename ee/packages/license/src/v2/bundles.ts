export type BundleFeature =
	| 'auditing'
	| 'canned-responses'
	| 'ldap-enterprise'
	| 'livechat-enterprise'
	| 'voip-enterprise'
	| 'omnichannel-mobile-enterprise'
	| 'engagement-dashboard'
	| 'push-privacy'
	| 'scalability'
	| 'saml-enterprise'
	| 'device-management'
	| 'oauth-enterprise'
	| 'federation'
	| 'videoconference-enterprise'
	| 'message-read-receipt'
	| 'outlook-calendar';

interface IBundle {
	[key: string]: BundleFeature[];
}

const bundles: IBundle = {
	enterprise: [
		'auditing',
		'canned-responses',
		'ldap-enterprise',
		'livechat-enterprise',
		'voip-enterprise',
		'omnichannel-mobile-enterprise',
		'engagement-dashboard',
		'push-privacy',
		'scalability',
		'saml-enterprise',
		'oauth-enterprise',
		'device-management',
		'federation',
		'videoconference-enterprise',
		'message-read-receipt',
		'outlook-calendar',
	],
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

export function getBundleModules(moduleName: string): string[] {
	if (moduleName === '*') {
		return Object.keys(bundles).reduce<string[]>((modules, bundle) => modules.concat(bundles[bundle]), []);
	}

	const bundle = getBundleFromModule(moduleName);
	if (!bundle || !bundles[bundle]) {
		return [];
	}

	return bundles[bundle];
}
