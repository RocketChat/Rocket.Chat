import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose';

import { sign, verify } from '../src/index';

it('should sign and verify a jwt with RS256', async () => {
	const { publicKey, privateKey } = await generateKeyPair('RS256');
	const spki = await exportSPKI(publicKey);
	const pkcs8 = await exportPKCS8(privateKey);

	const licenseV3 = {
		information: {
			id: '64d28d096400df50b6ace670',
			autoRenew: true,
			createdAt: '2023-08-08T18:44:25.719+0000',
			visualExpiration: '2024-09-08T18:44:25.719+0000',
			notifyAdminsAt: '2024-09-01T18:44:25.719+0000',
			notifyUsersAt: '2024-09-05T18:44:25.719+0000',
			trial: false,
			offline: false,
			grantedBy: { method: 'manual', seller: 'john.rocketseed@rocket.chat' },
			grantedTo: { name: 'Alice Clientseed', company: 'Client', email: 'alice.clientseed@client.com' },
			legalText: "This license can't be used for reselling",
			notes: 'Plan Premium',
			tags: [{ name: 'Enterprise', color: '#CCCCCC' }],
		},
		validation: {
			serverUrls: [{ value: 'https://localhost:3000', type: 'url' }],
			serverVersions: [{ value: '6.4' }],
			cloudWorkspaceId: 'alks-a9sj0diba09shdiasodjha9s0diha9s9duabsiuhdai0sdh0a9hs09da09s8d09a80s9d8',
			serverUniqueId: '64d28d096400df50b6ace670',
			validUntil: '2024-09-18T18:44:25.719+0000',
			validFrom: '2024-07-08T18:44:25.719+0000',
			installationAllowedUntil: '2024-07-09T18:44:25.719+0000',
			legalTextAgreement: { type: 'accepted', acceptedVia: 'cloud' },
			statisticsReport: { required: true, allowedStaleInDays: 5 },
		},
		grantedModules: [
			{ module: 'auditing' },
			{ module: 'canned-responses' },
			{ module: 'ldap-enterprise' },
			{ module: 'livechat-enterprise' },
			{ module: 'voip-enterprise' },
			{ module: 'omnichannel-mobile-enterprise' },
			{ module: 'engagement-dashboard' },
			{ module: 'push-privacy' },
			{ module: 'scalability' },
			{ module: 'teams-mention' },
			{ module: 'saml-enterprise' },
			{ module: 'oauth-enterprise' },
			{ module: 'device-management' },
			{ module: 'federation' },
			{ module: 'videoconference-enterprise' },
			{ module: 'message-read-receipt' },
			{ module: 'outlook-calendar' },
		],
		limits: {
			activeUsers: [
				{ max: 500, behavior: 'start_fair_policy' },
				{ max: 1000, behavior: 'prevent_action' },
				{ max: 1100, behavior: 'invalidate_license' },
			],
			guestUsers: [
				{ max: 200, behavior: 'start_fair_policy' },
				{ max: 400, behavior: 'prevent_action' },
				{ max: 500, behavior: 'invalidate_license' },
			],
			roomsPerGuest: [
				{ max: 5, behavior: 'start_fair_policy' },
				{ max: 10, behavior: 'prevent_action' },
			],
			privateApps: [
				{ max: 5, behavior: 'start_fair_policy' },
				{ max: 10, behavior: 'prevent_action' },
				{ max: 11, behavior: 'invalidate_license' },
			],
			marketplaceApps: [
				{ max: 5, behavior: 'start_fair_policy' },
				{ max: 10, behavior: 'prevent_action' },
				{ max: 11, behavior: 'invalidate_license' },
			],
		},
		cloudMeta: { lastStatisticId: '64d28d096400df50b6ace671' },
	};

	const token = await sign(licenseV3, pkcs8);
	const [payload, protectedHeader] = await verify(token, spki);

	expect(protectedHeader).toEqual({ alg: 'RS256', typ: 'JWT' });
	expect(payload).toEqual(licenseV3);
});
