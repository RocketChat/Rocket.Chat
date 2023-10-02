/**
 * FromV2ToV3
 * Transform a License V2 into a V3 representation.
 */

import type { ILicenseV2 } from '../definition/ILicenseV2';
import type { ILicenseV3 } from '../definition/ILicenseV3';
import type { LicenseModule } from '../definition/LicenseModule';
import { isBundle, getBundleFromModule, getBundleModules } from './bundles';
import { getTagColor } from './getTagColor';

export const convertToV3 = (v2: ILicenseV2): ILicenseV3 => {
	return {
		version: '3.0',
		information: {
			autoRenew: false,
			visualExpiration: new Date(Date.parse(v2.meta?.trialEnd || v2.expiry)).toISOString(),
			trial: v2.meta?.trial || false,
			offline: false,
			createdAt: new Date().toISOString(),
			grantedBy: {
				method: 'manual',
				seller: 'V2',
			},
			// if no tag present, it means it is an old license, so try check for bundles and use them as tags
			tags: v2.tag
				? [v2.tag]
				: [
						...(v2.modules.filter(isBundle).map(getBundleFromModule).filter(Boolean) as string[]).map((tag) => ({
							name: tag,
							color: getTagColor(tag),
						})),
				  ],
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
					validUntil: new Date(Date.parse(v2.expiry)).toISOString(),
					invalidBehavior: 'invalidate_license',
				},
			],
			statisticsReport: {
				required: true,
			},
		},
		grantedModules: [
			...new Set(
				v2.modules
					.map((licenseModule) => (isBundle(licenseModule) ? getBundleModules(licenseModule) : [licenseModule]))
					.reduce((prev, curr) => [...prev, ...curr], [])
					.map((licenseModule) => ({ module: licenseModule as LicenseModule })),
			),
		],
		limits: {
			...(v2.maxActiveUsers
				? {
						activeUsers: [
							{
								max: v2.maxActiveUsers,
								behavior: 'prevent_action',
							},
						],
				  }
				: {}),
			...(v2.maxGuestUsers
				? {
						guestUsers: [
							{
								max: v2.maxGuestUsers,
								behavior: 'prevent_action',
							},
						],
				  }
				: {}),
			...(v2.maxRoomsPerGuest
				? {
						roomsPerGuest: [
							{
								max: v2.maxRoomsPerGuest,
								behavior: 'prevent_action',
							},
						],
				  }
				: {}),
			...(v2.apps?.maxPrivateApps
				? {
						privateApps: [
							{
								max: v2.apps.maxPrivateApps,
								behavior: 'prevent_action',
							},
						],
				  }
				: {}),
			...(v2.apps?.maxMarketplaceApps
				? {
						marketplaceApps: [
							{
								max: v2.apps.maxMarketplaceApps,
								behavior: 'prevent_action',
							},
						],
				  }
				: {}),
		},
		cloudMeta: v2.meta,
	};
};
