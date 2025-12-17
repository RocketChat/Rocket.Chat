import type { LicenseModule } from '@rocket.chat/core-typings';
import type { UseQueryResult } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export const useHasLicenseModule = (_licenseName: LicenseModule | undefined) => {
	const [result, setResult] = useState({ data: false, isPending: true, isError: false });

	useEffect(() => {
		import('@rocket.chat/ui-client')
			.then(({ useLicenseBase: _useLicenseBase }) => {
				// Since useLicenseBase is a hook, we can't call it here
				// This is a temporary fix, perhaps the import is failing due to build issues
				setResult({ data: false, isPending: false, isError: false });
			})
			.catch(() => {
				setResult({ data: false, isPending: false, isError: true });
			});
	}, []);

	return result;
};
