import type { LicenseModule } from '@rocket.chat/core-typings';

interface IBundle {
	[key: string]: LicenseModule[];
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
		'teams-mention',
		'hide-watermark',
		'custom-roles',
		'accessibility-certification',
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
