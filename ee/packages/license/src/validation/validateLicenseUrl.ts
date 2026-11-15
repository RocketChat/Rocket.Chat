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
			if (
				url.type === 'url' &&
				url.value.length === 64 &&
				/^[a-f0-9]{64}$/i.test(url.value) &&
				validateHash(url.value, hashedWorkspaceUrl)
			) {
				// If the url type is 'url' but the value looks like a hash, validate it as a hash to avoid invalidating licenses unnecessarily.
				logger.warn(
					`License URL with type 'url' is actually a hash. Validating as hash to avoid invalidating license unnecessarily. url: ${url.value}`,
				);
				return false;
			}

			if (url.type === 'hash' && !/^[a-f0-9]{64}$/i.test(url.value) && validateUrl(url.value, workspaceUrl)) {
				// If the url type is 'hash' but the value looks like a url, validate it as a url to avoid invalidating licenses unnecessarily.
				logger.warn(
					`License URL with type 'hash' does not look like a hash. Validating as url to avoid invalidating license unnecessarily. url: ${url.value}`,
				);
				return false;
			}

			switch (url.type) {
				case 'regex':
					return !validateRegex(url.value, workspaceUrl);
				case 'hash':
					return !validateHash(url.value, hashedWorkspaceUrl);
				case 'url':
					return !validateUrl(url.value, workspaceUrl);
				default:
					return true; // If the type is unknown, consider it invalid to be safe.
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
