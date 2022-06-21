import { useState, useEffect } from 'react';

import { hasLicense } from '../../app/license/client';

export const useHasLicense = (licenseName: string): 'loading' | boolean => {
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
