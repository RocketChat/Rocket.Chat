import type { ILicenseV3, BehaviorWithContext, LicenseValidationOptions } from '@rocket.chat/core-typings';

import { isBehaviorAllowed } from '../isItemAllowed';
import type { LicenseManager } from '../license';
import { logger } from '../logger';
import { getResultingBehavior } from './getResultingBehavior';

const validateRegex = (licenseURL: string, url: string) => {
	licenseURL = licenseURL
		.replace(/\./g, '\\.') // convert dots to literal
		.replace(/\*/g, '.*'); // convert * to .*
	const regex = new RegExp(`^${licenseURL}$`, 'i');

	return !!regex.exec(url);
};

const validateUrl = (licenseURL: string, url: string) => {
	return licenseURL.toLowerCase() === url.toLowerCase();
};

const validateHash = (licenseURL: string, hashedUrl: string) => {
	return licenseURL === hashedUrl;
};

export function validateLicenseUrl(this: LicenseManager, license: ILicenseV3, options: LicenseValidationOptions): BehaviorWithContext[] {
	if (!isBehaviorAllowed('invalidate_license', options)) {
		return [];
	}

	const {
		validation: { serverUrls },
	} = license;

	const workspaceUrl = this.getWorkspaceUrl();

	if (!workspaceUrl) {
		logger.error('Unable to validate license URL without knowing the workspace URL.');
		return [getResultingBehavior({ behavior: 'invalidate_license' }, { reason: 'url' })];
	}

	const hashedWorkspaceUrl = this.hashWorkspaceUrl(workspaceUrl);

	return serverUrls
		.filter((url) => {
			switch (url.type) {
				case 'regex':
					return !validateRegex(url.value, workspaceUrl);
				case 'hash':
					return !validateHash(url.value, hashedWorkspaceUrl);
				case 'url':
					// Fall back for hash validation in case the type was not set correctly, to avoid invalidating licenses unnecessarily.
					return !validateUrl(url.value, workspaceUrl) && !validateHash(url.value, hashedWorkspaceUrl);
				default:
					return false;
			}
		})
		.map((url) => {
			if (!options.suppressLog) {
				logger.error({
					msg: 'Url validation failed',
					licenseUrl: url,
					workspaceUrl,
					hashedWorkspaceUrl,
				});
			}
			return getResultingBehavior({ behavior: 'invalidate_license' }, { reason: 'url' });
		});
}
