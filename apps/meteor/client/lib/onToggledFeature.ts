import type { LicenseModule } from '@rocket.chat/core-typings';
import { QueryObserver } from '@tanstack/react-query';

import { fetchFeatures } from './fetchFeatures';
import { queryClient } from './queryClient';

export const onToggledFeature = (
	feature: LicenseModule,
	{
		up,
		down,
	}: {
		up?: () => void;
		down?: () => void;
	},
): (() => void) => {
	const observer = new QueryObserver(queryClient, {
		queryKey: ['licenses'],
		queryFn: fetchFeatures,
		staleTime: Infinity,
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
