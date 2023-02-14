import { useState, useEffect } from 'react';

import { hasLicense } from '../../app/license/client';
import type { BundleFeature } from '../../app/license/server/bundles';

export const useHasLicenseModule = (licenseName: BundleFeature): 'loading' | boolean => {
	const [license, setLicense] = useState<'loading' | boolean>('loading');

	useEffect(() => {
		hasLicense(licenseName).then((enabled) => {
			if (enabled) {
				return setLicense(true);
			}
			setLicense(false);
		});
	}, [licenseName]);

	return license;
};
