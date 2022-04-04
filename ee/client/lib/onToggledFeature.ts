import { QueryObserver } from 'react-query';

import { queryClient } from '../../../client/lib/queryClient';
import type { BundleFeature } from '../../app/license/server/bundles';
import { fetchFeatures } from './fetchFeatures';

export const onToggledFeature = (
	feature: BundleFeature,
	{
		up,
		down,
	}: {
		up?: () => void;
		down?: () => void;
	},
): (() => void) => {
	const observer = new QueryObserver(queryClient, {
		queryKey: ['ee.features'],
		queryFn: fetchFeatures,
	});

	let enabled = false;

	return observer.subscribe((result) => {
		if (!result.isSuccess) {
			return;
		}

		const features = result.data;
		const hasFeature = features.includes(feature);

		if (!enabled && hasFeature) {
			up?.();
			enabled = true;
		}

		if (enabled && !hasFeature) {
			down?.();
			enabled = false;
		}
	});
};
