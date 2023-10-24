import type { LicenseModule } from '@rocket.chat/license';
import { useMethod, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useHasLicenseModule = (licenseName: LicenseModule): 'loading' | boolean => {
	const method = useMethod('license:getModules');
	const uid = useUserId();

	const features = useQuery(['ee.features'], method, {
		enabled: !!uid,
	});

	return features.data?.includes(licenseName) ?? 'loading';
};
