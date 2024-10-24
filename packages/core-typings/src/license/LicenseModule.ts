export const CoreModules = [
	'auditing',
	'canned-responses',
	'ldap-enterprise',
	'livechat-enterprise',
	'voip-enterprise',
	'omnichannel-mobile-enterprise',
	'engagement-dashboard',
	'push-privacy',
	'scalability',
	'teams-mention',
	'saml-enterprise',
	'oauth-enterprise',
	'device-management',
	'federation',
	'videoconference-enterprise',
	'message-read-receipt',
	'outlook-calendar',
	'hide-watermark',
	'custom-roles',
	'accessibility-certification',
	'unlimited-presence',
	'contact-id-verification',
	'teams-voip',
] as const;

export type InternalModuleName = (typeof CoreModules)[number];
export type ExternalModuleName = `${string}.${string}`;
export type LicenseModule = InternalModuleName | ExternalModuleName;
