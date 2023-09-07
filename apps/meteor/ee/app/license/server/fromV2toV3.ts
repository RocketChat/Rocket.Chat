/**
 * FromV2ToV3
 * Transform a License V2 into a V3 representation.
 */

import type { ILicenseV2, ILicenseV3, Module, LicenseLimit, LicensePeriod } from '@rocket.chat/core-typings';

export const fromV2toV3 = (v2: ILicenseV2): ILicenseV3 => {
	return {
		version: '3.0',
		information: {
			autoRenew: false,
			visualExpiration: Date.parse(v2.expiry).toString(),
			trial: v2.meta?.trial || false,
			offline: false,
			createdAt: Date.now().toString(),
			grantedBy: {
				method: 'manual',
				seller: 'V2',
			},
			tags: v2.tag ? [v2.tag] : undefined,
		},
		validation: {
			serverUrls: [
				{
					value: v2.url,
					type: 'url',
				},
			],
			validPeriods: [
				{
					validUntil: Date.parse(v2.expiry).toString(),
					invalidBehavior: 'invalidate_license',
				} as LicensePeriod,
			],
			statisticsReport: {
				required: false,
			},
		},
		grantedModules: v2.modules.map((module) => {
			return {
				module: module as Module,
			};
		}),
		limits: {
			activeUsers: [
				{
					max: v2.maxActiveUsers,
					behavior: 'invalidate_license',
				} as LicenseLimit,
			],
			guestUsers: [
				{
					max: v2.maxGuestUsers,
					behavior: 'invalidate_license',
				} as LicenseLimit,
			],
			roomsPerGuest: [
				{
					max: v2.maxRoomsPerGuest,
					behavior: 'invalidate_license',
				} as LicenseLimit,
			],
			privateApps: [
				{
					max: v2.apps?.maxPrivateApps,
					behavior: 'prevent_installation',
				} as LicenseLimit,
			],
			marketplaceApps: [
				{
					max: v2.apps?.maxMarketplaceApps,
					behavior: 'prevent_installation',
				} as LicenseLimit,
			],
		},
	};
};
