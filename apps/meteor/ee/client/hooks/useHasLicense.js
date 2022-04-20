import { useState, useEffect } from 'react';

import { hasLicense } from '../../app/license/client';

export const useHasLicense = (licenseName) => {
	const [license, setLicense] = useState('loading');

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
