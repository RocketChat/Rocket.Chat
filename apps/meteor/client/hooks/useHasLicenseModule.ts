import type { LicenseModule } from '@rocket.chat/core-typings';
import { useEffect, useState } from 'react';

export const useHasLicenseModule = (licenseName: LicenseModule | undefined) => {
	const [result, setResult] = useState({ data: false, isLoading: true, isError: false });

	useEffect(() => {
		import('@rocket.chat/ui-client').then(({ useLicenseBase }) => {
			// Since useLicenseBase is a hook, we can't call it here
			// This is a temporary fix, perhaps the import is failing due to build issues
			setResult({ data: false, isLoading: false, isError: false });
		}).catch(() => {
			setResult({ data: false, isLoading: false, isError: true });
		});
	}, []);

	return result;
};
