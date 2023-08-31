import { useMethod, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import type { BundleFeature } from '../../app/license/server/bundles';

export const useHasLicenseModule = (licenseName: BundleFeature): 'loading' | boolean => {
	const method = useMethod('license:getModules');
	const uid = useUserId();

	const features = useQuery(['ee.features'], method, {
		enabled: !!uid,
	});

	return features.data?.includes(licenseName) ?? 'loading';
};
