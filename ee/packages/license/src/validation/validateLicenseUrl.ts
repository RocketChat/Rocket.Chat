import type { ILicenseV3 } from '../definition/ILicenseV3';
import type { BehaviorWithContext, LicenseBehavior } from '../definition/LicenseBehavior';
import type { LicenseManager } from '../license';
import { logger } from '../logger';
import { getResultingBehavior } from './getResultingBehavior';

export const validateUrl = (licenseURL: string, url: string) => {
	licenseURL = licenseURL
		.replace(/\./g, '\\.') // convert dots to literal
		.replace(/\*/g, '.*'); // convert * to .*
	const regex = new RegExp(`^${licenseURL}$`, 'i');

	return !!regex.exec(url);
};

export function validateLicenseUrl(
	this: LicenseManager,
	license: ILicenseV3,
	behaviorFilter: (behavior: LicenseBehavior) => boolean,
): BehaviorWithContext[] {
	if (!behaviorFilter('invalidate_license')) {
		return [];
	}

	const {
		validation: { serverUrls },
	} = license;

	const workspaceUrl = this.getWorkspaceUrl();

	if (!workspaceUrl) {
		logger.error('Unable to validate license URL without knowing the workspace URL.');
		return [getResultingBehavior({ behavior: 'invalidate_license' })];
	}

	return serverUrls
		.filter((url) => {
			switch (url.type) {
				case 'regex':
					// #TODO
					break;
				case 'hash':
					// #TODO
					break;
				case 'url':
					return !validateUrl(url.value, workspaceUrl);
			}

			return false;
		})
		.map((url) => {
			logger.error({
				msg: 'Url validation failed',
				url,
				workspaceUrl,
			});
			return getResultingBehavior({ behavior: 'invalidate_license' });
		});
}
