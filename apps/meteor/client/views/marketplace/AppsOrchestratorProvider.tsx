import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useStream } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import React, { useEffect } from 'react';

import { AppsOrchestratorContext } from './AppsOrchestratorContext';
import { marketplaceQueryKeys } from './queryKeys';
import { AppClientOrchestratorInstance } from '../../apps/orchestrator';
import { useInvalidateLicense, useLicense } from '../../hooks/useLicense';

type AppsOrchestratorProviderProps = {
	children: ReactNode;
};

const AppsOrchestratorProvider = ({ children }: AppsOrchestratorProviderProps) => {
	const queryClient = useQueryClient();

	const invalidate = useDebouncedCallback(
		() => {
			queryClient.invalidateQueries(marketplaceQueryKeys.all);
		},
		100,
		[],
	);

	const stream = useStream('apps');

	const { isLoading, data } = useLicense({ loadValues: true });
	const unlicensed = isLoading || !data?.license;

	const invalidateLicenseQuery = useInvalidateLicense();

	useEffect(
		() =>
			stream('apps', ([key]) => {
				if (['app/added', 'app/removed', 'app/updated', 'app/statusUpdate', 'app/settingUpdated'].includes(key)) {
					invalidate();
				}

				if (!unlicensed) return;

				if (['app/added', 'app/removed'].includes(key)) {
					invalidateLicenseQuery();
				}
			}),
		[invalidate, invalidateLicenseQuery, unlicensed, stream],
	);

	return <AppsOrchestratorContext.Provider children={children} value={AppClientOrchestratorInstance} />;
};

export default AppsOrchestratorProvider;
